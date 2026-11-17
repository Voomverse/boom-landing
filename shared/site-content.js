import { renderAbout } from "./about.js";
import { renderSocials } from "./socials.js";
export function renderInformation() {
  return `<div class="site-information">
    ${renderAbout()}
    <div class="shell information-rest">
    <section id="como-funciona" class="information-section" aria-labelledby="how-title">
      <p class="eyebrow">TU PRIMER PASO</p><h2 class="display" id="how-title">CÓMO FUNCIONA VEN</h2>
      <ol class="steps-grid">
        <li class="panel"><h3>Cuéntanos quién te inspira</h3><p>Escribe el nombre de la celebrity que te interesa. No necesitas elegir un nombre de una lista ni tener una cuenta en VOOM.</p></li>
        <li class="panel"><h3>Apúntate al aviso de apertura</h3><p>Deja tu email, confirma que tienes al menos 18 años y decide si quieres que VOOM te escriba. Puedes consultar la política de privacidad antes de enviar el formulario.</p></li>
        <li class="panel"><h3>Elige si algún plan te interesa</h3><p>Después de inscribirte puedes indicar una preferencia de plan o elegir «Todavía ninguno». Hoy no pagas nada y no se realiza ningún cobro.</p></li>
      </ol>
    </section>
    <section id="preguntas-frecuentes" class="information-section" aria-labelledby="faq-title">
      <p class="eyebrow">ANTES DE ENTRAR</p><h2 class="display" id="faq-title">PREGUNTAS FRECUENTES</h2>
      <div class="faq-list">
        <details><summary>¿Qué es Voomverse y qué relación tiene con VOOM?</summary><p>Voomverse, S.L.U. es la compañía responsable de VOOM y de esta landing. VEN es la campaña de acceso anticipado para las personas que quieren conocer la apertura de VOOM.</p></details>
        <details><summary>¿Inscribirme en VEN tiene algún coste?</summary><p>No. Inscribirte en la lista y expresar una preferencia de plan no tiene coste. El formulario no pide una tarjeta ni datos de pago, y elegir un plan no activa una suscripción.</p></details>
        <details><summary>¿Quién puede inscribirse?</summary><p>VEN está dirigido a personas de 18 años o más. Necesitas un email válido y aceptar las comunicaciones indicadas en el formulario. Puedes solicitar la baja cuando quieras.</p></details>
        <details><summary>¿La inscripción garantiza una experiencia o un premio?</summary><p>No. La inscripción permite registrar tu interés y avisarte sobre VOOM. No adjudica una experiencia, un premio ni una plaza. Cualquier futura promoción o sorteo tendrá sus propias condiciones.</p></details>
        <details><summary>¿Cómo puedo consultar o borrar mis datos?</summary><p>Puedes escribir a <a href="mailto:legal@voomverse.com">legal@voomverse.com</a> indicando el email con el que te inscribiste y tu solicitud. En la <a href="/privacidad/">política de privacidad</a> explicamos qué datos recogemos y cómo ejercer tus derechos.</p></details>
      </div>
    </section>
    </div>
  </div>`;
}
export function footerDetails(year = new Date().getUTCFullYear()) {
  return `<div class="footer-details">${renderSocials()}<nav aria-label="Información de VOOM"><a href="/#sobre-nosotros">Sobre nosotros</a><a href="/#como-funciona">Cómo funciona</a><a href="/#preguntas-frecuentes">Preguntas frecuentes</a><a href="/privacidad/">Privacidad</a></nav><p>© ${year} Voomverse, S.L.U. Todos los derechos reservados.</p><p lang="en">Made with <span role="img" aria-label="love">❤️</span> by Voomverse, S.L.U.</p></div>`;
}
