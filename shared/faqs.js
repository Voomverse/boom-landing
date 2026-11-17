export function renderFaq() {
  return `<section id="preguntas-frecuentes" class="faq-section" aria-labelledby="faq-title">
    <div class="faq-layout">
      <div class="faq-intro">
        <p class="eyebrow faq-eyebrow">ANTES DE ENTRAR</p>
        <h2 class="display faq-headline" id="faq-title">LO QUE TE ESTÁS<span>PREGUNTANDO</span></h2>
        <p class="faq-subtitle">Cinco respuestas cortas, con la letra pequeña <br class="faq-desktop-break">a la vista.</p>
      </div>
      <div class="faq-items">
        <article class="faq-item" aria-labelledby="faq-company">
          <img class="faq-icon" src="/assets/faq-company.webp" alt="" width="52" height="52" loading="lazy" decoding="async">
          <div class="faq-copy">
            <h3 class="faq-question" id="faq-company">¿Qué es VEN y quién está detrás?</h3>
            <p class="faq-answer"><strong>VEN es la campaña de acceso anticipado de VOOM,</strong> la lista de quienes quieren <br class="faq-desktop-break">enterarse de su apertura. Detrás está Voomverse, S.L., la compañía responsable <br class="faq-desktop-break">de VOOM y de esta página.</p>
          </div>
        </article>
        <article class="faq-item" aria-labelledby="faq-cost">
          <img class="faq-icon" src="/assets/faq-cost.webp" alt="" width="52" height="52" loading="lazy" decoding="async">
          <div class="faq-copy">
            <h3 class="faq-question" id="faq-cost">¿Apuntarme cuesta algo?</h3>
            <p class="faq-answer"><strong>Nada.</strong> Apuntarte a la lista y marcar un nivel es gratis. El formulario no pide tarjeta <br class="faq-desktop-break">ni datos de pago, y marcar un nivel no activa ninguna suscripción.</p>
          </div>
        </article>
        <article class="faq-item" aria-labelledby="faq-adult">
          <img class="faq-icon" src="/assets/faq-adult.webp" alt="" width="52" height="52" loading="lazy" decoding="async">
          <div class="faq-copy">
            <h3 class="faq-question" id="faq-adult">¿Quién puede apuntarse?</h3>
            <p class="faq-answer"><strong>Cualquier persona de 18 años o más.</strong> Necesitas un email válido y aceptar las <br class="faq-desktop-break">comunicaciones que indica el formulario. Puedes pedir la baja cuando quieras.</p>
          </div>
        </article>
        <article class="faq-item" aria-labelledby="faq-experience">
          <img class="faq-icon" src="/assets/faq-experience.webp" alt="" width="52" height="52" loading="lazy" decoding="async">
          <div class="faq-copy">
            <h3 class="faq-question" id="faq-experience">¿Apuntarme me garantiza una experiencia o un premio?</h3>
            <p class="faq-answer"><strong>No.</strong> Apuntarte sirve para registrar tu interés y para que te avisemos sobre VOOM. <br class="faq-desktop-break">No adjudica una experiencia, un premio ni una plaza. Cualquier promoción o <br class="faq-desktop-break">sorteo futuro tendrá sus propias condiciones.</p>
          </div>
        </article>
        <article class="faq-item" aria-labelledby="faq-privacy">
          <img class="faq-icon" src="/assets/faq-privacy.webp" alt="" width="52" height="52" loading="lazy" decoding="async">
          <div class="faq-copy">
            <h3 class="faq-question" id="faq-privacy">¿Cómo consulto o borro mis datos?</h3>
            <p class="faq-answer"><strong>Escríbenos.</strong> Manda un mensaje a <a href="mailto:legal@voomverse.com">legal@voomverse.com</a> y dinos con qué email te <br class="faq-desktop-break">apuntaste y qué necesitas. En la <a class="privacy-link" href="/privacidad/">política de privacidad</a> tienes el resto de los detalles.</p>
          </div>
        </article>
      </div>
    </div>
  </section>`;
}
