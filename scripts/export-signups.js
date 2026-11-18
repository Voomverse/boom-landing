import { list, get } from "@vercel/blob";
import { writeFile } from "node:fs/promises";
import { utmKeys } from "../shared/utm.js";

if (!process.env.BLOB_READ_WRITE_TOKEN)
  throw new Error(
    "Load BLOB_READ_WRITE_TOKEN from your secure environment first.",
  );
async function records(prefix) {
  const result = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor });
    for (const blob of page.blobs) {
      const response = await get(blob.url, { access: "private" });
      if (!response || response.statusCode !== 200)
        throw new Error("A record could not be read; export stopped.");
      result.push(await new Response(response.stream).json());
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return result;
}
const preferences = new Map();
for (const record of (await records("preferences/")).sort((a, b) =>
  a.createdAt.localeCompare(b.createdAt),
))
  preferences.set(record.signupId, record.plan);
// Neutralize spreadsheet formula injection, including untrusted names and emails.
const cell = (value) =>
  '"' +
  String(value ?? "")
    .replace(/^[=+@\-\t\r]/, "'$&")
    .replaceAll('"', '""') +
  '"';
const columns = [
  "id",
  "createdAt",
  "email",
  "celebrity",
  "variant",
  "plan",
  "adult",
  "consent",
  "privacyPolicyUrl",
  "consentVersion",
  "privacyPolicyVersion",
  "country",
  "region",
  "city",
  ...utmKeys,
];
const rows = (await records("signups/"))
  .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  .map((record) => ({
    ...record,
    plan: preferences.get(record.id) || "",
    country: record.location?.country || "",
    region: record.location?.region || "",
    city: record.location?.city || "",
    ...Object.fromEntries(utmKeys.map((key) => [key, record.utm?.[key]])),
  }));
const csv = [columns, ...rows.map((row) => columns.map((key) => row[key]))]
  .map((row) => row.map(cell).join(","))
  .join("\r\n");
const file = `signups-${new Date().toISOString().slice(0, 10)}.csv`;
await writeFile(file, "\uFEFF" + csv, { mode: 0o600, flag: "wx" });
console.log(
  `Exported ${rows.length} records to ${file}. Keep this file private.`,
);
