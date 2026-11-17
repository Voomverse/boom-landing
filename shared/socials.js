import { icon } from "@fortawesome/fontawesome-svg-core";
import {
  faInstagram,
  faTiktok,
  faXTwitter,
  faFacebookF,
  faYoutube,
  faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";

export const socialProfiles = [
  { name: "Instagram", href: "#", icon: faInstagram },
  { name: "TikTok", href: "#", icon: faTiktok },
  { name: "X", href: "#", icon: faXTwitter },
  { name: "Facebook", href: "#", icon: faFacebookF },
  { name: "YouTube", href: "#", icon: faYoutube },
  { name: "LinkedIn", href: "#", icon: faLinkedinIn },
];
export function renderSocials() {
  return `<nav class="social-links" aria-label="Redes sociales"><p>Redes sociales · Próximamente</p><ul>${socialProfiles
    .map((profile) => {
      const pending = profile.href === "#";
      const label = `${profile.name}${pending ? " (próximamente)" : " (se abre en otra pestaña)"}`;
      return `<li title="${label}"><a href="${profile.href}" aria-label="${label}" ${pending ? 'aria-disabled="true" tabindex="-1"' : 'target="_blank" rel="noopener noreferrer"'}>${icon(profile.icon, { attributes: { "aria-hidden": "true", focusable: "false" } }).html.join("")}</a></li>`;
    })
    .join("")}</ul></nav>`;
}
