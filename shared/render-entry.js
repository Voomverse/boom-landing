export function renderArt(name) {
  if (name === "planet")
    return '<picture class="art planet"><source media="(min-width: 800px)" srcset="/assets/planet-desktop.webp"><img src="/assets/planet-mobile.webp" alt="" fetchpriority="high" decoding="async" width="1170" height="792"></picture>';
  const sizes = {
    keyhole: [1170, 796],
    ticket: [1170, 773],
    password: [1170, 786],
    door: [900, 532],
  };
  const [width, height] = sizes[name];
  return `<img class="art ${name}" src="/assets/${name}.webp" alt="" fetchpriority="high" decoding="async" width="${width}" height="${height}">`;
}
export function renderEntry(
  variant,
  { expired = false, interactive = false, variantKey = "ven" } = {},
) {
  const campaignClass = { planet: "ven", keyhole: "secreto", ticket: "antes-de-morir", password: "quanta" }[variant.art] || "ven";
  return `<section class="entry shell ${campaignClass}">
    ${renderArt(variant.art)}
    <div class="intro">
      <p class="eyebrow">${variant.label}</p>
      ${variant.title ? '<div class="ven-title" aria-hidden="true"><img src="/assets/ven-wordmark.webp" alt="" width="401" height="147"></div>' : ""}<h1 class="display ${variant.geometric ? "geometric" : ""}">${variant.heading}</h1>
      <p class="description">${variant.description}</p>
    </div>
    <form class="signup panel" method="post" action="/api/signup" novalidate aria-label="Inscripción en VEN">
      <div class="field"><label for="celebrity">${variant.question}</label>
        <input id="celebrity" name="celebrity" placeholder="Nombre de la celebrity" required maxlength="120" autocomplete="off" aria-describedby="celebrity-help">
        <p class="help" id="celebrity-help">Así sabemos a quién quieres ver primero.</p></div>
      <div class="field"><label for="email">Tu email</label>
        <input id="email" name="email" placeholder="tu@email.com" type="email" required maxlength="254" autocomplete="email" inputmode="email" aria-describedby="email-error">
        <p class="error" id="email-error" hidden>Revisa tu email: le falta algo.</p></div>
      <div class="consents" role="group" aria-describedby="consent-error">
        <label class="checkbox"><input id="adult" name="adult" type="checkbox" required><span>Tengo 18 años o más.</span></label>
        <label class="checkbox"><input id="consent" name="consent" type="checkbox" required><span>Acepto la <a class="privacy-link" href="/privacidad/">política de privacidad</a> y que VOOM me escriba.</span></label>
        <p class="error" id="consent-error" hidden>Marca las dos casillas para seguir.</p>
      </div>
      <div class="honeypot" aria-hidden="true"><label for="website">Website</label><input id="website" name="website" tabindex="-1" autocomplete="off"></div>
      <p class="error server-error" role="alert" hidden></p>
      <button class="button primary" type="submit" ${expired || !interactive ? "disabled" : ""}>${expired ? "INSCRIPCIONES CERRADAS" : "AVÍSAME PRIMERO"}</button>
    </form>
  </section>`;
}
