import {
  resolvePrivacyPolicyUrl,
  defaultPrivacyPath,
} from "../shared/privacy.js";
export const privacyUrl =
  resolvePrivacyPolicyUrl(import.meta.env.VITE_PRIVACY_POLICY_URL) ||
  defaultPrivacyPath;
const deadline = import.meta.env.VITE_CAMPAIGN_END;
export const closingDate =
  deadline && Number.isFinite(Date.parse(deadline)) ? new Date(deadline) : null;
export const closingLabel = closingDate
  ? new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      timeZone: "Europe/Madrid",
    }).format(closingDate)
  : "";
export { variants } from "../shared/campaigns.js";
