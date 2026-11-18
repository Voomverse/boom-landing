import "./intro.css";

const seenKey = "ven-intro-seen-v1";

export function initIntro({ enabled = true } = {}) {
  if (
    !enabled ||
    window.location.pathname !== "/" ||
    window.location.hash ||
    document.body.dataset.screen !== "entry" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    typeof HTMLDialogElement === "undefined" ||
    !HTMLDialogElement.prototype.showModal ||
    document.querySelector("#ven-intro")
  )
    return;

  try {
    if (sessionStorage.getItem(seenKey)) return;
  } catch {
    // The intro also works when browser storage is unavailable.
  }

  const dialog = document.createElement("dialog");
  dialog.id = "ven-intro";
  dialog.className = "intro-dialog";
  dialog.setAttribute("aria-labelledby", "intro-title");
  dialog.setAttribute("aria-describedby", "intro-description");
  dialog.innerHTML = `
    <h2 class="intro-accessible" id="intro-title">Presentación de VOOM</h2>
    <video class="intro-video" playsinline preload="none" poster="/assets/ven-intro-poster.webp" aria-label="Presentación de VOOM, con música y efectos de sonido">
      <track kind="captions" src="/assets/ven-intro.es.vtt" srclang="es" label="Español (sonido)">
    </video>
    <img class="intro-logo" src="/assets/voom-logo.webp" alt="VOOM" width="158" height="54">
    <div class="intro-start">
      <p class="intro-description" id="intro-description">8 segundos · Música y efectos de sonido</p>
      <button class="button primary intro-play" type="button" autofocus>Reproducir con sonido</button>
      <p class="intro-error" role="alert" hidden>No se ha podido reproducir el vídeo. Puedes volver a intentarlo o entrar sin vídeo.</p>
    </div>
    <button class="intro-skip" type="button">Entrar sin vídeo</button>`;

  const video = dialog.querySelector("video");
  if (!video.canPlayType("video/mp4")) return;

  const play = dialog.querySelector(".intro-play");
  const start = dialog.querySelector(".intro-start");
  const error = dialog.querySelector(".intro-error");
  const events = new AbortController();
  const options = { signal: events.signal };
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
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
      // Storage is optional; the landing must remain usable.
    }
    document.querySelector("#main")?.focus({ preventScroll: true });
  }

  play.addEventListener(
    "click",
    async () => {
      play.disabled = true;
      play.textContent = "Cargando el vídeo…";
      error.hidden = true;
      video.controls = true;
      video.tabIndex = 0;
      video.muted = false;
      video.preload = "auto";
      // Fetch the full clip only after an explicit play gesture.
      if (!video.getAttribute("src")) video.src = "/assets/ven-intro.mp4";
      try {
        await video.play();
        if (!finished) video.focus({ preventScroll: true });
      } catch {
        if (finished) return;
        play.disabled = false;
        play.textContent = "Reproducir con sonido";
        error.hidden = false;
      }
    },
    options,
  );
  video.addEventListener("playing", () => (start.hidden = true), options);
  video.addEventListener("ended", finish, options);
  video.addEventListener("error", finish, options);
  dialog.querySelector(".intro-skip").addEventListener("click", finish, options);
  dialog.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();
      finish();
    },
    options,
  );
  dialog.addEventListener("close", finish, options);

  document.body.append(dialog);
  try {
    dialog.showModal();
    document.documentElement.classList.add("intro-is-open");
  } catch {
    events.abort();
    dialog.remove();
  }
}
