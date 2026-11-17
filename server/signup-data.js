import { createHash } from "node:crypto";

export const normalizeEmail = (email) => email.trim().toLowerCase();
export const signupPath = (email) =>
  `signups/by-email/${createHash("sha256").update(normalizeEmail(email)).digest("hex")}.json`;

export async function signupExists(email, { get, list, token }) {
  const options = { access: "private", useCache: false, token };
  const current = await get(signupPath(email), options);
  if (current) {
    await current.stream?.cancel();
    return true;
  }
  // Preserve and check the original dated signup folders, without enumerating
  // all new email-keyed records or deleting/moving any existing personal data.
  let folderCursor;
  do {
    const page = await list({
      prefix: "signups/",
      mode: "folded",
      cursor: folderCursor,
      token,
    });
    for (const folder of page.folders || []) {
      if (!/^signups\/\d{4}-\d{2}-\d{2}\/$/.test(folder)) continue;
      let cursor;
      do {
        const legacy = await list({ prefix: folder, cursor, token });
        for (const blob of legacy.blobs) {
          const response = await get(blob.url, options);
          if (!response || response.statusCode !== 200)
            throw new Error("Legacy signup could not be checked");
          const record = await new Response(response.stream).json();
          if (typeof record.email !== "string")
            throw new Error("Legacy signup has no email");
          if (normalizeEmail(record.email) === normalizeEmail(email))
            return true;
        }
        cursor = legacy.hasMore ? legacy.cursor : undefined;
      } while (cursor);
    }
    folderCursor = page.hasMore ? page.cursor : undefined;
  } while (folderCursor);
  return false;
}

export async function canonicalSignupExists(email, { get, token }) {
  const record = await get(signupPath(email), {
    access: "private",
    useCache: false,
    token,
  });
  if (!record) return false;
  await record.stream?.cancel();
  return true;
}

export function approximateLocation(headers, env) {
  // Vercel supplies/overwrites these geolocation headers. Do not trust arbitrary
  // client-provided headers when running the app outside the Vercel platform.
  if (env.VERCEL !== "1") return null;
  const read = (name, limit) => {
    const raw = headers[name];
    if (typeof raw !== "string" || raw.length > 512) return null;
    try {
      const value = decodeURIComponent(raw).trim();
      return value &&
        value.length <= limit &&
        !/[\u0000-\u001f\u007f]/.test(value)
        ? value
        : null;
    } catch {
      return null;
    }
  };
  const countryValue = read("x-vercel-ip-country", 2);
  const country =
    countryValue && /^[A-Z]{2}$/.test(countryValue) ? countryValue : null;
  const region = read("x-vercel-ip-country-region", 100);
  const city = read("x-vercel-ip-city", 160);
  return country || region || city
    ? { country, region, city, source: "vercel-ip", accuracy: "approximate" }
    : null;
}
