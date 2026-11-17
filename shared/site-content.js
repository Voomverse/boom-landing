import { renderAbout } from "./about.js";
import { renderHowItWorks } from "./how-it-works.js";
import { renderFaq } from "./faqs.js";
import { renderSocials } from "./socials.js";
export function renderInformation() {
  return `<div class="site-information">
    ${renderAbout()}
    ${renderHowItWorks()}
    ${renderFaq()}
  </div>`;
}
export function footerDetails(year = new Date().getUTCFullYear()) {
  return `<div class="footer-details">${renderSocials()}<nav aria-label="Información de VOOM"><a href="/#sobre-nosotros">Sobre nosotros</a><a href="/#como-funciona">Cómo funciona</a><a href="/#preguntas-frecuentes">Preguntas frecuentes</a><a href="/privacidad/">Privacidad</a></nav><p>© ${year} Voomverse, S.L.U. Todos los derechos reservados.</p><p lang="en">Made with <span role="img" aria-label="love">❤️</span> by Voomverse, S.L.U.</p></div>`;
}
