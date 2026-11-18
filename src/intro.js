import { Pause, Play, Volume2, VolumeX } from "lucide-static";
import "./intro.css";

const seenKey = "ven-intro-seen-v2";
const decorative = (svg) =>
  svg.replace("<svg", '<svg aria-hidden="true" focusable="false"');

export function initIntro({ enabled = true } = {}) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (
    !enabled ||
    window.location.pathname !== "/" ||
    window.location.hash ||
    document.body.dataset.screen !== "entry" ||
    reducedMotion.matches ||
    typeof HTMLDialogElement === "undefined" ||
    !HTMLDialogElement.prototype.showModal ||
    document.querySelector("#ven-intro")
  )
    return;

  try {
    if (sessionStorage.getItem(seenKey)) return;
  } catch {
    // Storage is optional.
  }

  const portrait = window.matchMedia("(orientation: portrait)").matches;
  const asset = portrait ? "ven-intro-portrait" : "ven-intro";
  const dialog = document.createElement("dialog");
  dialog.id = "ven-intro";
  dialog.className = "intro-dialog";
  dialog.setAttribute("aria-labelledby", "intro-title");
  dialog.setAttribute("aria-describedby", "intro-description");
  dialog.innerHTML = `
    <h2 class="intro-accessible" id="intro-title">Presentación de VOOM</h2>
    <p class="intro-accessible" id="intro-description">Vídeo de 8 segundos con música y efectos de sonido. Puedes silenciarlo, pausarlo o saltar la introducción.</p>
    <video class="intro-video" playsinline preload="auto" poster="/assets/${asset}-poster.webp" aria-label="Presentación de VOOM, con música y efectos de sonido">
      <track kind="captions" src="/assets/ven-intro.es.vtt" srclang="es" label="Español (sonido)">
    </video>
    <img class="intro-logo" src="/assets/voom-intro-logo.webp" alt="VOOM" width="330" height="101">
    <button class="intro-skip" type="button" aria-label="Saltar vídeo" autofocus>Saltar</button>
    <div class="intro-controls">
      <button class="intro-control intro-sound" type="button" hidden></button>
      <button class="intro-control intro-playback" type="button" hidden></button>
    </div>
    <p class="intro-accessible intro-status" role="status" aria-live="polite"></p>`;

  const video = dialog.querySelector("video");
  if (!video.canPlayType("video/mp4")) return;
  const sound = dialog.querySelector(".intro-sound");
  const playback = dialog.querySelector(".intro-playback");
  const status = dialog.querySelector(".intro-status");
  const events = new AbortController();
  const options = { signal: events.signal };
  let started = false;
  let leaving = false;
  let disposed = false;
  let exitTimer;

  function syncSound() {
    const label = video.muted ? "Activar sonido" : "Silenciar";
    sound.innerHTML = `${decorative(video.muted ? VolumeX : Volume2)}<span>${label}</span>`;
    sound.title = label;
  }

  function syncPlayback() {
    if (leaving || disposed) return;
    const label = !started ? "Reproducir con sonido" : video.paused ? "Reanudar vídeo" : "Pausar vídeo";
    playback.innerHTML = decorative(video.paused ? Play : Pause) + (!started ? `<span>${label}</span>` : "");
    playback.setAttribute("aria-label", label);
    playback.title = label;
    playback.hidden = false;
  }

  function cleanup() {
    if (disposed) return;
    disposed = true;
    clearTimeout(exitTimer);
    events.abort();
    video.pause();
    video.removeAttribute("src");
    video.load();
    if (dialog.open) dialog.close();
    dialog.remove();
    document.documentElement.classList.remove("intro-is-open");
    try {
      sessionStorage.setItem(seenKey, "1");
    } catch {
      // The landing must remain usable when storage is blocked.
    }
    document.querySelector("#main")?.focus({ preventScroll: true });
  }

  function finish({ animate = true } = {}) {
    if (leaving || disposed) return;
    leaving = true;
    video.pause();
    if (!animate || reducedMotion.matches) {
      cleanup();
      return;
    }
    // Hold the final frame while the existing landing fades into view.
    dialog.classList.add("intro-leaving");
    exitTimer = setTimeout(cleanup, 750);
  }

  async function resume() {
    try {
      await video.play();
    } catch (error) {
      if (leaving || disposed) return;
      if (error.name === "NotSupportedError") {
        finish({ animate: false });
        return;
      }
      status.textContent = started
        ? "Pulsa Reanudar vídeo para continuar."
        : "Para iniciar el vídeo, pulsa Reproducir con sonido. También puedes saltar la introducción.";
      syncPlayback();
    }
  }

  sound.addEventListener("click", () => {
    video.muted = !video.muted;
    syncSound();
  }, options);
  playback.addEventListener("click", () => {
    if (video.paused) void resume();
    else video.pause();
  }, options);
  video.addEventListener("playing", () => {
    started = true;
    sound.hidden = false;
    status.textContent = "";
    syncPlayback();
  }, options);
  video.addEventListener("pause", syncPlayback, options);
  video.addEventListener("volumechange", syncSound, options);
  video.addEventListener("ended", () => finish(), options);
  video.addEventListener("error", () => finish({ animate: false }), options);
  dialog.querySelector(".intro-skip").addEventListener("click", () => finish(), options);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    finish();
  }, options);
  dialog.addEventListener("transitionend", (event) => {
    if (leaving && event.target === dialog && event.propertyName === "opacity") cleanup();
  }, options);
  dialog.addEventListener("close", cleanup, options);
  syncSound();
  document.body.append(dialog);
  try {
    dialog.showModal();
    document.documentElement.classList.add("intro-is-open");
    video.src = `/assets/${asset}.mp4`;
    void resume();
  } catch {
    cleanup();
  }
}
