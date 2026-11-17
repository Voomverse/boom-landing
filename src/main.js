import "@fontsource/jost/latin-400.css";
import "@fontsource/jost/latin-500.css";
import "@fontsource/jost/latin-600.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/anton/latin-400.css";
import {
  createIcons,
  Moon,
  Star,
  KeyRound,
  Ticket,
  Check,
  Asterisk,
} from "lucide";
import { variants, privacyUrl, closingDate, closingLabel } from "./config.js";
import "./style.css";

const main = document.querySelector("main");
const params = new URLSearchParams(location.search);
const path = location.pathname.replace(/^\/+|\/+$/g, "");
const variantKey = Object.hasOwn(variants, params.get("variant"))
  ? params.get("variant")
  : Object.hasOwn(variants, path)
    ? path
    : "ven";
const variant = variants[variantKey];
const icons = () =>
  createIcons({
    icons: { Moon, Star, KeyRound, Ticket, Check, Asterisk },
    attrs: { "aria-hidden": "true", "stroke-width": 1.7 },
  });
const art = (name) =>
  name === "planet"
    ? '<picture class="art planet"><source media="(min-width: 800px)" srcset="/assets/planet-desktop.webp"><img src="/assets/planet-mobile.webp" alt="" fetchpriority="high" width="1170" height="792"></picture>'
    : `<img class="art ${name}" src="/assets/${name}.webp" alt="" width="900" height="700">`;
function privacyLinks() {
  document.querySelectorAll(".privacy-link").forEach((link) => {
    link.href = privacyUrl;
    link.target = "_blank";
    link.rel = "noopener";
  });
}
privacyLinks();
if (closingLabel)
  document.querySelectorAll(".deadline").forEach((el) => {
    el.hidden = false;
    el.textContent = `VEN CIERRA EL ${closingLabel.toUpperCase()}`;
  });

function reveal() {
  icons();
  privacyLinks();
  window.scrollTo({ top: 0, behavior: "instant" });
  main.focus({ preventScroll: true });
}
function entry() {
  document.querySelector("#header-label").textContent = "VEN";
  document.body.dataset.screen = "entry";
  const expired = closingDate && new Date() > closingDate;
  main.innerHTML = `<section class="entry shell ${variantKey}">
    ${art(variant.art)}
    <div class="intro">
      <p class="eyebrow">${variant.label}</p>
      ${variant.title ? '<h1 class="ven-title"><img src="/assets/ven-wordmark.webp" alt="VEN." width="401" height="147"></h1><h2 class="display">' : `<h1 class="display ${variant.geometric ? "geometric" : ""}">`}${variant.heading}${variant.title ? "</h2>" : "</h1>"}
      <p class="description">${variant.description}</p>
    </div>
    <form class="signup panel" novalidate aria-label="Inscripción en VEN">
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
      <button class="button primary" type="submit" ${expired ? "disabled" : ""}>${expired ? "INSCRIPCIONES CERRADAS" : "AVÍSAME PRIMERO"}</button>
    </form>
  </section>`;
  reveal();
  const form = main.querySelector("form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const celebrity = form.elements.celebrity;
    const email = form.elements.email;
    const missingName = !celebrity.value.trim();
    const invalidEmail = !email.validity.valid;
    const invalidConsent =
      !form.elements.adult.checked || !form.elements.consent.checked;
    celebrity.setAttribute("aria-invalid", String(missingName));
    email.setAttribute("aria-invalid", String(invalidEmail));
    const help = document.querySelector("#celebrity-help");
    help.textContent = missingName
      ? "Escribe el nombre de tu celebrity."
      : "Así sabemos a quién quieres ver primero.";
    help.classList.toggle("error", missingName);
    document.querySelector("#email-error").hidden = !invalidEmail;
    document.querySelector("#consent-error").hidden = !invalidConsent;
    for (const name of ["adult", "consent"])
      form.elements[name].setAttribute(
        "aria-invalid",
        String(!form.elements[name].checked),
      );
    if (missingName || invalidEmail || invalidConsent) {
      (missingName
        ? celebrity
        : invalidEmail
          ? email
          : form.elements.adult.checked
            ? form.elements.consent
            : form.elements.adult
      ).focus();
      return;
    }
    const button = form.querySelector("button");
    const error = form.querySelector(".server-error");
    error.hidden = true;
    button.disabled = true;
    button.textContent = "GUARDANDO…";
    try {
      const result = await api({
        action: "signup",
        celebrity: celebrity.value.trim(),
        email: email.value.trim(),
        adult: true,
        consent: true,
        variant: variantKey,
        website: form.elements.website.value,
      });
      try {
        sessionStorage.setItem("ven-receipt", JSON.stringify(result));
      } catch {
        /* Storage is optional. */
      }
      offer(result);
    } catch (e) {
      error.textContent = e.message;
      error.hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = "AVÍSAME PRIMERO";
    }
  });
}
async function api(payload) {
  let response;
  try {
    response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data.error || "No hemos podido guardar tus datos. Inténtalo de nuevo.",
    );
  return data;
}
function offer(receipt) {
  document.querySelector("#header-label").textContent = "QUANTA";
  document.body.dataset.screen = "offer";
  main.innerHTML = `<div class="offer shell">
    <p class="success-banner"><span class="success-icon"><i data-lucide="check"></i></span>Hecho. Ya estás en VEN.</p>
    <section class="offer-hero">${art("door")}<h1 class="display">Y AHORA,<b class="desktop-only"> LO QUE</b><span><b class="mobile-only">LO QUE </b>VINISTE<br class="mobile-break"> A BUSCAR.</span></h1></section>
    <section class="benefits" aria-labelledby="benefits-title"><div><h2 class="display" id="benefits-title">QUANTA</h2><p class="eyebrow benefits-tagline">EL CÍRCULO MÁS CERCANO A LAS CELEBRITIES</p></div>
    <ul class="benefit-grid">
      <li class="panel"><i data-lucide="moon"></i><p>Vive experiencias con celebrities, cara a cara.</p></li>
      <li class="panel"><i data-lucide="star"></i><p>Obtén el mejor sitio en sus shows y eventos.</p></li>
      <li class="panel"><i data-lucide="key-round"></i><p>Descubre El Secreto valioso de cada celebrity.</p></li>
      <li class="panel"><i data-lucide="ticket"></i><p>Participa en sorteos de experiencias y apariciones en series verticales con ellos.</p></li>
    </ul></section>
    <section class="pricing" aria-label="Planes de VOOM"><p class="pricing-intro">APROVECHA. Una oportunidad por tiempo limitado.</p>
      <div class="price-grid">
        <article class="price-card panel"><h3 class="eyebrow">MES A MES</h3><p class="price">16,99 € <small>al mes</small></p><p class="muted">Son <span class="two-year-total">407,76</span> € en dos años.</p></article>
        <article class="price-card panel"><h3 class="eyebrow">ANUAL</h3><p class="price">186,89 €</p><p class="muted">Por un año.</p></article>
        <article class="price-card special panel"><h3 class="badge eyebrow">OFERTA VEN</h3><p class="price">186,89 €</p><p class="duration">por dos años</p>
          <ul><li><i data-lucide="check"></i>30 DANKEs</li><li><i data-lucide="check"></i>QUANTA desde el primer día</li></ul>
          <p class="saving">Te ahorras <strong>220,87 €</strong> frente al mes a mes.</p>
          <div class="offer-note"><p>Así entra quien llega primero.</p><p class="muted">Solo en VEN${closingLabel ? `, hasta el ${closingLabel}` : ""}.</p></div>
        </article>
      </div>
      <aside class="dankes panel"><i data-lucide="asterisk"></i><p><strong>Los DANKEs son los «gracias» de VOOM.</strong> Con ellos participas en los sorteos de tickets, y cada ticket es tu lugar en una experiencia junto a una celebrity. Con ellos también reservas tus noches privadas.</p></aside>
    </section>
    <section class="choose" aria-labelledby="choose-title"><div><h2 class="display" id="choose-title">¿CUÁL ELEGIRÍAS CUANDO VOOM ABRA?</h2><p class="muted">Hoy no pagas nada: solo nos dices cuál.</p></div>
      <div class="choices"><div class="choice-buttons"><button class="button outline" data-plan="monthly">MES A MES</button><button class="button outline" data-plan="annual">ANUAL</button><button class="button primary" data-plan="ven">OFERTA VEN</button></div><button class="text-button" data-plan="none">Todavía ninguno</button><p class="error" id="choice-error" role="alert" hidden></p></div>
    </section>
  </div>`;
  reveal();
  main.querySelectorAll("[data-plan]").forEach((button) =>
    button.addEventListener("click", async () => {
      const buttons = [...main.querySelectorAll("[data-plan]")];
      buttons.forEach((el) => (el.disabled = true));
      const error = document.querySelector("#choice-error");
      error.hidden = true;
      try {
        await api({
          action: "preference",
          receipt: receipt.receipt,
          plan: button.dataset.plan,
        });
        try {
          sessionStorage.removeItem("ven-receipt");
        } catch {
          /* Storage is optional. */
        }
        confirmation(button.dataset.plan === "none" ? "none" : "selected");
      } catch (e) {
        error.textContent = e.message;
        error.hidden = false;
        buttons.forEach((el) => (el.disabled = false));
      }
    }),
  );
}
function confirmation(kind) {
  document.body.dataset.screen = "confirmation";
  document.querySelector("#header-label").textContent = "VEN";
  main.innerHTML = `<section class="confirmation shell">${art(kind === "none" ? "password" : "door")}<div><p class="eyebrow">QUANTA</p><h1 class="geometric">${kind === "none" ? "SIN <span>PROBLEMA.</span>" : "APUNTADO."}</h1><p class="description">${kind === "none" ? "Cuando VOOM abra, lo sabrás antes que nadie." : "Cuando VOOM abra, te escribimos para que lo actives."}</p></div></section>`;
  reveal();
}
let saved;
try {
  saved = JSON.parse(sessionStorage.getItem("ven-receipt"));
} catch {
  /* Storage is optional. */
}
if (saved?.receipt && saved?.expiresAt > Date.now()) offer(saved);
else entry();
