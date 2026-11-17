import { ArrowRight } from "lucide-static";

const decorative = (svg) =>
  svg.replace("<svg", '<svg aria-hidden="true" focusable="false"');

export function renderAbout() {
  return `<section id="sobre-nosotros" class="about-section" aria-labelledby="about-title">
    <div class="about-shell">
      <p class="eyebrow about-eyebrow">SOBRE NOSOTROS</p>
      <h2 class="display about-headline" id="about-title">DE LA PANTALLA A <span>COMPARTIR<br>EXPERIENCIAS JUNTOS</span></h2>
      <div class="about-narrative">
        <div class="about-perspective">
          <p>A tus ídolos los ves cada día en una pantalla.</p>
          <p>Les das like y sigues viviendo tu vida.</p>
          <p>Ellos siguen subiendo.</p>
        </div>
        <div class="about-explanation">
          <p><strong>VOOM es lo que viene después.</strong> Estamos preparando el lugar donde ganadores <br class="about-desktop-break">del Óscar y del Grammy, leyendas del deporte y creadores que mueven a <br class="about-desktop-break">millones de personas como tú dejan de estar solo en una pantalla. Vas a <br class="about-desktop-break">aprender de ellos y a compartir con ellos lo que ahora solo miras en tu móvil.</p>
          <p><strong>VEN es nuestra invitación a llegar primero.</strong><br>Antes de abrir queremos saber de quién te gustaría aprender y con quién te <br class="about-desktop-break">gustaría vivir algo así. Tu respuesta nos enseña qué buscan los primeros.</p>
        </div>
      </div>
      <div class="about-doors" aria-labelledby="about-doors-title">
        <h3 class="eyebrow about-doors-title" id="about-doors-title">TRES PUERTAS DE ENTRADA</h3>
        <div class="about-door-grid">
          <article class="panel about-door">
            <img class="about-door-icon" src="/assets/about-secreto.webp" alt="" width="52" height="52" loading="lazy" decoding="async">
            <h4 class="display">SECRETO</h4>
            <p class="about-door-lead">Lo que a tus ídolos les costó años</p>
            <p class="about-door-description">Aprende su fórmula de vida, con el método <br class="about-desktop-break">para aplicarla en la tuya. El día que lo <br class="about-desktop-break">hagas, tu vida empezará a cambiar.</p>
            <a href="/secreto/" aria-label="Abrir esta puerta: SECRETO">Abrir esta puerta ${decorative(ArrowRight)}</a>
          </article>
          <article class="panel about-door">
            <img class="about-door-icon" src="/assets/about-antes-de-morir.webp" alt="" width="52" height="52" loading="lazy" decoding="async">
            <h4 class="display">ANTES DE MORIR</h4>
            <p class="about-door-lead">Un sueño de tu ídolo, viviéndolo a <br class="about-desktop-break">su lado</p>
            <p class="about-door-description">Las celebrities también tienen una <br class="about-desktop-break">lista de sueños por cumplir. Imagina <br class="about-desktop-break">acompañarle y viajar juntos.</p>
            <a href="/antes-de-morir/" aria-label="Abrir esta puerta: ANTES DE MORIR">Abrir esta puerta ${decorative(ArrowRight)}</a>
          </article>
          <article class="panel about-door">
            <img class="about-door-icon" src="/assets/about-quanta.webp" alt="" width="52" height="52" loading="lazy" decoding="async">
            <h4 class="display">QUANTA</h4>
            <p class="about-door-lead">El círculo más cercano</p>
            <p class="about-door-description">Aquí las celebrities dejan de estar lejos <br class="about-desktop-break">y los tendrás a un brindis de distancia. <br class="about-desktop-break">Entrar cuesta... y en cuanto cruzas <br class="about-desktop-break">la puerta entenderás el por qué.</p>
            <a href="/quanta/" aria-label="Abrir esta puerta: QUANTA">Abrir esta puerta ${decorative(ArrowRight)}</a>
          </article>
        </div>
      </div>
      <div class="about-footnote">
        <p>Detrás de VOOM está Voomverse, S.L. (sociedad unipersonal).</p>
        <img src="/assets/about-waves.webp" alt="" width="340" height="70" loading="lazy" decoding="async">
      </div>
    </div>
  </section>`;
}
