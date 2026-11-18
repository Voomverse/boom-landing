export const utmKeys = Object.freeze([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
]);

const invalidTagCharacter = /[^\p{L}\p{M}\p{N} ._-]/u;
const hasLetterOrNumber = /[\p{L}\p{N}]/u;

export function normalizeUtm(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const tags = {};
  for (const key of utmKeys) {
    if (!Object.hasOwn(input, key)) continue;
    const value = input[key];
    if (
      typeof value !== "string" ||
      value.length > 120 ||
      invalidTagCharacter.test(value)
    )
      continue;
    const label = value.trim().normalize("NFC");
    if (label.length <= 120 && hasLetterOrNumber.test(label)) tags[key] = label;
  }
  return Object.keys(tags).length ? tags : null;
}
