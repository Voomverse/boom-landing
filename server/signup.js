import {
  normalizeEmail,
  signupPath,
  signupExists,
  canonicalSignupExists,
  approximateLocation,
} from "./signup-data.js";
import { checkSignupEmailDomain } from "./email-domain.js";
import { resolvePrivacyPolicyUrl } from "../shared/privacy.js";
import { normalizeUtm } from "../shared/utm.js";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const variants = new Set(["ven", "secreto", "antes-de-morir", "quanta"]);
const plans = new Set(["monthly", "annual", "ven", "none"]);
const failure = (status, error, headers) => ({
  status,
  body: { error },
  headers,
});
const sign = (value, secret) =>
  createHmac("sha256", secret).update(value).digest("base64url");
const validEmail = (value) =>
  typeof value === "string" &&
  value.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const hasControl = (value) => /[\u0000-\u001f\u007f]/.test(value);

async function bodyOf(req) {
  if (Number(req.headers["content-length"]) > 4096) throw new Error("size");
  if (req.body !== undefined) {
    const raw =
      typeof req.body === "string" || Buffer.isBuffer(req.body)
        ? req.body.toString()
        : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > 4096) throw new Error("size");
    return JSON.parse(raw);
  }
  const parts = [];
  let length = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    length += buffer.length;
    if (length > 4096) throw new Error("size");
    parts.push(buffer);
  }
  return JSON.parse(Buffer.concat(parts).toString());
}

export async function handleSignup(
  req,
  {
    env,
    put,
    get,
    list,
    now = Date.now,
    uuid = randomUUID,
    checkEmailDomain = checkSignupEmailDomain,
  },
) {
  if (req.method !== "POST")
    return failure(405, "Método no permitido.", { Allow: "POST" });
  if (
    !req.headers["content-type"]?.toLowerCase().startsWith("application/json")
  )
    return failure(415, "Formato no válido.");
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host)
        return failure(403, "Origen no permitido.");
    } catch {
      return failure(403, "Origen no permitido.");
    }
  }
  let data;
  try {
    data = await bodyOf(req);
  } catch (e) {
    return failure(e.message === "size" ? 413 : 400, "Solicitud no válida.");
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    return failure(400, "Solicitud no válida.");
  const privacyPolicyUrl = resolvePrivacyPolicyUrl(env.VITE_PRIVACY_POLICY_URL);
  if (!env.BLOB_READ_WRITE_TOKEN || !privacyPolicyUrl)
    return failure(
      503,
      "Las inscripciones todavía no están abiertas. Vuelve pronto.",
    );
  if (data.action === "signup") {
    const end = env.VITE_CAMPAIGN_END;
    if (end && !Number.isFinite(Date.parse(end)))
      return failure(
        503,
        "Las inscripciones todavía no están abiertas. Vuelve pronto.",
      );
    if (end && now() > Date.parse(end))
      return failure(410, "El plazo de inscripción ha terminado.");
    if (data.website) return failure(400, "Solicitud no válida.");
    if (
      typeof data.celebrity !== "string" ||
      !data.celebrity.trim() ||
      data.celebrity.trim().length > 120 ||
      hasControl(data.celebrity)
    )
      return failure(400, "Escribe el nombre de tu celebrity.");
    if (typeof data.email !== "string" || !validEmail(data.email.trim()))
      return failure(400, "Revisa tu email: le falta algo.");
    if (data.adult !== true || data.consent !== true)
      return failure(400, "Marca las dos casillas para seguir.");
    if (!variants.has(data.variant)) return failure(400, "Campaña no válida.");
    const email = normalizeEmail(data.email);
    try {
      if (!(await checkEmailDomain(email)))
        return failure(400, "Usa un email con un dominio que reciba correo.");
    } catch {
      return failure(
        503,
        "No hemos podido verificar el dominio de tu email. Inténtalo de nuevo.",
      );
    }
    const storage = { get, list, token: env.BLOB_READ_WRITE_TOKEN };
    const duplicate = () =>
      failure(
        409,
        "Este email ya está en VEN. No necesitas volver a inscribirte.",
      );
    try {
      if (await signupExists(email, storage)) return duplicate();
    } catch {
      return failure(
        503,
        "No hemos podido comprobar tu inscripción. Inténtalo de nuevo.",
      );
    }
    const id = uuid();
    const createdAt = new Date(now()).toISOString();
    const expiresAt = now() + 24 * 60 * 60 * 1000;
    const payload = Buffer.from(JSON.stringify({ id, expiresAt })).toString(
      "base64url",
    );
    const receipt = `${payload}.${sign(payload, env.BLOB_READ_WRITE_TOKEN)}`;
    const utm = normalizeUtm(data.utm);
    const record = {
      id,
      createdAt,
      email,
      location: approximateLocation(req.headers, env),
      celebrity: data.celebrity.trim(),
      variant: data.variant,
      ...(utm && { utm }),
      adult: true,
      consent: true,
      privacyPolicyUrl,
      privacyPolicyVersion: "ven-2026-11-18.2",
      consentText:
        "Tengo 18 años o más. Acepto la política de privacidad y que VOOM me escriba.",
      consentVersion: "ven-2",
    };
    try {
      await put(signupPath(email), JSON.stringify(record), {
        access: "private",
        allowOverwrite: false,
        contentType: "application/json",
        addRandomSuffix: false,
        token: env.BLOB_READ_WRITE_TOKEN,
      });
    } catch {
      // A competing request may have saved this email after our read. Never
      // overwrite it or issue a receipt that could alter the existing signup.
      try {
        if (await canonicalSignupExists(email, storage)) return duplicate();
      } catch {
        /* Report an unavailable save below. */
      }
      return failure(
        503,
        "No hemos podido guardar tu inscripción. Inténtalo de nuevo.",
      );
    }
    return { status: 201, body: { receipt, expiresAt } };
  }
  if (data.action === "preference") {
    if (
      !plans.has(data.plan) ||
      typeof data.receipt !== "string" ||
      data.receipt.length > 1024
    )
      return failure(400, "Selección no válida.");
    let receipt;
    try {
      const [payload, signature, extra] = data.receipt.split(".");
      const expected = sign(payload, env.BLOB_READ_WRITE_TOKEN);
      if (
        extra ||
        !signature ||
        Buffer.byteLength(signature) !== Buffer.byteLength(expected) ||
        !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      )
        throw new Error("signature");
      receipt = JSON.parse(Buffer.from(payload, "base64url").toString());
      if (
        !/^[a-f0-9-]{36}$/.test(receipt.id) ||
        !Number.isFinite(receipt.expiresAt) ||
        receipt.expiresAt <= now()
      )
        throw new Error("expired");
    } catch {
      return failure(
        401,
        "Tu sesión ha caducado. Vuelve a inscribirte para elegir.",
      );
    }
    const record = {
      signupId: receipt.id,
      plan: data.plan,
      createdAt: new Date(now()).toISOString(),
    };
    try {
      await put(
        `preferences/${receipt.id}/${uuid()}.json`,
        JSON.stringify(record),
        {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          token: env.BLOB_READ_WRITE_TOKEN,
        },
      );
    } catch {
      return failure(
        503,
        "No hemos podido guardar tu elección. Inténtalo de nuevo.",
      );
    }
    return { status: 201, body: { ok: true } };
  }
  return failure(400, "Solicitud no válida.");
}
