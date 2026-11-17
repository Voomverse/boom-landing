export const defaultPrivacyPath = "/privacidad/";

export function resolvePrivacyPolicyUrl(value) {
  if (!value) return defaultPrivacyPath;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
