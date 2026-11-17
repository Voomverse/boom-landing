import { ArrowRight, CircleCheck } from "lucide-static";

const decorative = (svg) =>
  svg.replace("<svg", '<svg aria-hidden="true" focusable="false"');

export function renderHowItWorks() {
  return `<section id="como-funciona" class="how-section" aria-labelledby="how-title">
    <div class="how-shell">
      <p class="eyebrow how-eyebrow">TU PRIMER PASO</p>
      <h2 class="display how-headline" id="how-title"><span>VEN.</span> SON TRES PASOS.</h2>
      <p class="how-subtitle">Lo que tardas en escribir un nombre y un email.</p>
      <ol class="how-steps" role="list">
        <li class="panel how-card">
          <div class="how-card-header">
            <span class="display how-number" aria-hidden="true">1</span>
            <img class="how-icon" src="/assets/how-star.webp" alt="" width="52" height="52" loading="lazy" decoding="async">
          </div>
          <h3>Nombra a tu ídolo</h3>
          <p class="how-description">Escribe el nombre de la celebrity de <br class="how-desktop-break">la que te gustaría aprender. El campo <br class="how-desktop-break">está en blanco y pide a quien tú quieras.</p>
          <div class="how-note">${decorative(CircleCheck)}<p><strong>Tu respuesta cuenta.</strong> Así sabemos a <br class="how-desktop-break">quién quieres ver en VOOM.</p></div>
        </li>
        <li class="panel how-card">
          <div class="how-card-header">
            <span class="display how-number" aria-hidden="true">2</span>
            <img class="how-icon" src="/assets/how-mail.webp" alt="" width="52" height="52" loading="lazy" decoding="async">
          </div>
          <h3>Déjanos tu email</h3>
          <p class="how-description">Confirma que tienes 18 años o más <br class="how-desktop-break">y danos permiso para escribirte. La <br class="how-desktop-break"><a class="privacy-link" href="/privacidad/">política de privacidad</a> está a un clic, <br class="how-desktop-break">por si quieres leerla antes.</p>
          <div class="how-note">${decorative(CircleCheck)}<p><strong>Llegas primero.</strong> El día que VOOM abra, te <br class="how-desktop-break">avisamos.</p></div>
        </li>
        <li class="panel how-card">
          <div class="how-card-header">
            <span class="display how-number" aria-hidden="true">3</span>
            <div class="how-card-tools"><span class="how-optional">OPCIONAL</span><img class="how-icon" src="/assets/how-levels.webp" alt="" width="52" height="52" loading="lazy" decoding="async"></div>
          </div>
          <h3>Dinos qué nivel te tienta</h3>
          <p class="how-description">Después de apuntarte puedes marcar el <br class="how-desktop-break">nivel que más te atrae para pertenecer <br class="how-desktop-break">a VOOM, prefieres conocer Creadores <br class="how-desktop-break">de contenido o Celebrities.</p>
          <div class="how-note">${decorative(CircleCheck)}<p><strong>Sin compromiso.</strong> Hoy no pagas ni un <br class="how-desktop-break">euro.</p></div>
        </li>
      </ol>
      <div class="how-action">
        <a class="button how-cta" href="#experience">Nombrar a mi ídolo ${decorative(ArrowRight)}</a>
        <p>Sin cuenta y sin tarjeta.</p>
      </div>
    </div>
  </section>`;
}
