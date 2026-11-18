import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const base = process.env.INTRO_BASE_URL || "http://127.0.0.1:4176";
const output = process.env.INTRO_OUTPUT_DIR || "/tmp/ven-intro-qa";
mkdirSync(output, { recursive: true });
const browserOptions = {
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
};
const browser = await chromium.launch({
  ...browserOptions,
  args: ["--no-sandbox", "--autoplay-policy=user-gesture-required"],
});
let autoplayBrowser;
const report = { checks: [], accessibility: [], errors: [], consoleErrors: [] };
const mediaPath = /\/assets\/ven-intro(?:-portrait)?\.mp4(?:\?|$)/;

async function pageFor(options = {}, { expectedMediaError = false, testBrowser = browser } = {}) {
  const context = await testBrowser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
    ...options,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !expectedMediaError)
      report.consoleErrors.push(message.text());
  });
  await page.route("**/_vercel/insights/**", (route) => route.fulfill({
    status: 200, contentType: "application/javascript",
    body: "/* Local intro checks: analytics suppressed. */",
  }));
  return page;
}

async function waitForAudiblePlayback(page) {
  await page.getByRole("dialog", { name: "Presentación de VOOM" }).waitFor();
  await page.waitForFunction(() => {
    const video = document.querySelector(".intro-video");
    return video && !video.muted && video.volume > 0 && !video.paused && video.currentTime > 0.1;
  });
}

async function soundStartButton(page) {
  const button = page.getByRole("button", { name: "Reproducir con sonido", exact: true });
  await button.waitFor();
  const video = await page.locator(".intro-video").evaluate(element => ({
    paused: element.paused, muted: element.muted, currentTime: element.currentTime,
  }));
  assert.deepEqual(video, { paused: true, muted: false, currentTime: 0 },
    "The blocked intro waits at its first frame with sound enabled");
  return button;
}

async function landingReady(page) {
  await page.waitForFunction(() => document.body.dataset.screen === "entry");
  await page.locator("#ven-intro").waitFor({ state: "detached" });
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("intro-is-open")), false);
  assert.equal(await page.getByRole("button", { name: "AVÍSAME PRIMERO" }).isVisible(), true);
}

async function scan(page, state) {
  const result = await new AxeBuilder({ page }).include("#ven-intro")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  report.accessibility.push({ state, violations: result.violations.map(v => ({
    id: v.id, targets: v.nodes.map(node => node.target),
  })) });
  assert.equal(result.violations.length, 0, `${state}: accessibility`);
}

try {
  for (const [width, height] of [[1440, 900], [390, 844], [320, 568], [844, 390]]) {
    const page = await pageFor({ viewport: { width, height } });
    const requests = [];
    page.on("request", request => { if (mediaPath.test(request.url())) requests.push(request.url()); });
    await page.goto(base);
    const start = await soundStartButton(page);
    if (width === 390) {
      await page.screenshot({ path: `${output}/sound-start-mobile.png` });
      await scan(page, "blocked autoplay controls @ 390x844");
    }
    await start.press("Enter");
    await waitForAudiblePlayback(page);
    await page.getByRole("button", { name: "Pausar vídeo" }).click();
    await page.getByRole("button", { name: "Reanudar vídeo" }).waitFor();
    const expected = height > width ? "ven-intro-portrait.mp4" : "ven-intro.mp4";
    assert.equal(await page.locator("video").evaluate((v, name) => v.currentSrc.endsWith(name), expected), true);
    assert.ok(requests.length > 0 && requests.every(url => url.endsWith(expected)));
    assert.equal(await page.locator("video").evaluate(v => v.controls), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    for (const button of await page.locator("#ven-intro button").all()) {
      const box = await button.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height);
    }
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/intro-${width}.png` });
    await scan(page, `playback controls @ ${width}x${height}`);
    const footer = await page.locator(".site-footer").evaluate(el => el.outerHTML);
    await page.getByRole("button", { name: "Saltar vídeo" }).focus();
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("intro-sound")), true);
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("video").evaluate(v => v.muted), true);
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("video").evaluate(v => v.muted), false);
    const fade = await page.evaluate(async () => {
      const dialog = document.querySelector("#ven-intro");
      const video = dialog.querySelector("video");
      dialog.querySelector(".intro-skip").click();
      await new Promise(resolve => setTimeout(resolve, 200));
      return { leaving: dialog.classList.contains("intro-leaving"), opacity: Number(getComputedStyle(dialog).opacity), sourceRetained: Boolean(video.getAttribute("src")) };
    });
    assert.equal(fade.leaving, true);
    assert.ok(fade.opacity < 1 && fade.opacity >= 0);
    assert.equal(fade.sourceRetained, true, "The current frame remains loaded throughout the fade");
    await landingReady(page);
    assert.equal(await page.evaluate(() => document.activeElement.id), "main");
    assert.equal(await page.locator(".site-footer").evaluate(el => el.outerHTML), footer);
    await page.screenshot({ path: `${output}/landing-${width}.png` });
    await page.getByRole("button", { name: "AVÍSAME PRIMERO" }).click();
    assert.equal(await page.locator("#celebrity").getAttribute("aria-invalid"), "true");
    const beforeReload = requests.length;
    await page.reload();
    await landingReady(page);
    assert.equal(requests.length, beforeReload, "A dismissed intro does not download again on reload");
    report.checks.push(`Blocked autoplay waits for sound, matching orientation, compact controls, fade, keyboard and form @ ${width}x${height}`);
    await page.context().close();
  }

  autoplayBrowser = await chromium.launch({
    ...browserOptions,
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  const playing = await pageFor({}, { testBrowser: autoplayBrowser });
  await playing.goto(base);
  await waitForAudiblePlayback(playing);
  await playing.waitForFunction(() => document.querySelector("video")?.currentTime > 0.3);
  await playing.getByRole("button", { name: "Pausar vídeo" }).click();
  const media = await playing.locator("video").evaluate(v => ({
    duration: v.duration, muted: v.muted, volume: v.volume, controls: v.controls,
    captions: v.querySelector('track[kind="captions"]').srclang,
    audioBytes: v.webkitAudioDecodedByteCount,
  }));
  assert.ok(media.duration > 8 && media.duration < 9);
  assert.equal(media.muted, false);
  assert.equal(media.volume, 1);
  assert.equal(media.controls, false);
  assert.equal(media.captions, "es");
  if (typeof media.audioBytes === "number") assert.ok(media.audioBytes > 0);
  await playing.screenshot({ path: `${output}/playing-desktop.png` });
  await scan(playing, "unmuted playback controls");
  await playing.getByRole("button", { name: "Reanudar vídeo" }).click();
  await playing.locator("#ven-intro").waitFor({ state: "detached", timeout: 20000 });
  await landingReady(playing);
  assert.equal(await playing.evaluate(() => document.activeElement.id), "main");
  report.checks.push("Unmuted autoplay without interaction, pause/resume, captions and natural completion into the landing");
  report.media = media;

  let replayRequests = 0;
  playing.on("request", request => { if (mediaPath.test(request.url())) replayRequests++; });
  await playing.goto(base + "/?intro=replay");
  await landingReady(playing);
  assert.equal(replayRequests, 0, "The old replay query does not reload a completed intro");
  report.checks.push("The replay query does not reopen the intro after completion");
  await playing.context().close();

  const escape = await pageFor({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await escape.goto(base);
  const mobileStart = await soundStartButton(escape);
  await mobileStart.tap();
  await waitForAudiblePlayback(escape);
  await escape.locator("video").evaluate(v => (window.introTestVideo = v));
  await escape.screenshot({ path: `${output}/playing-mobile.png` });
  await escape.keyboard.press("Escape");
  await landingReady(escape);
  assert.equal(await escape.evaluate(() => window.introTestVideo.paused), true);
  assert.equal(await escape.evaluate(() => window.introTestVideo.getAttribute("src")), null);
  report.checks.push("Escape fades out and unloads the portrait video");
  await escape.context().close();

  for (const [label, path, options] of [
    ["reduced motion", "/", { reducedMotion: "reduce" }],
    ["no JavaScript", "/", { javaScriptEnabled: false }],
    ["deep link", "/#sobre-nosotros", {}],
    ["SECRETO", "/secreto/", {}],
    ["ANTES DE MORIR", "/antes-de-morir/", {}],
    ["QUANTA", "/quanta/", {}],
    ["query campaign", "/?variant=quanta", {}],
  ]) {
    const page = await pageFor(options);
    let requests = 0;
    page.on("request", request => { if (mediaPath.test(request.url())) requests++; });
    await page.goto(base + path);
    await page.locator("h1").waitFor();
    if (options.javaScriptEnabled !== false) await page.waitForFunction(() => Boolean(document.body.dataset.screen));
    assert.equal(await page.locator("#ven-intro").count(), 0);
    assert.equal(requests, 0);
    report.checks.push(`Intro bypass: ${label}`);
    await page.context().close();
  }

  const returning = await pageFor();
  await returning.addInitScript(() => sessionStorage.setItem("ven-receipt", JSON.stringify({ receipt: "intro-test-only", expiresAt: Date.now() + 60000 })));
  await returning.goto(base);
  await returning.getByText("Hecho. Ya estás en VEN.").waitFor();
  assert.equal(await returning.locator("#ven-intro").count(), 0);
  report.checks.push("Existing signup opens the offer directly");
  await returning.context().close();

  const privateMode = await pageFor();
  await privateMode.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("Blocked", "SecurityError"); };
    Storage.prototype.setItem = () => { throw new DOMException("Blocked", "SecurityError"); };
  });
  await privateMode.goto(base);
  await soundStartButton(privateMode);
  await privateMode.getByRole("button", { name: "Saltar vídeo" }).click();
  await landingReady(privateMode);
  report.checks.push("Unavailable storage still permits the landing");
  await privateMode.context().close();

  const missing = await pageFor({}, { expectedMediaError: true });
  let failedRequests = 0;
  await missing.route(mediaPath, route => { failedRequests++; return route.fulfill({ status: 404, body: "" }); });
  await missing.goto(base);
  await missing.waitForFunction(() => document.body.dataset.screen === "entry" && sessionStorage.getItem("ven-intro-seen-v2") === "1");
  await landingReady(missing);
  assert.ok(failedRequests > 0);
  report.checks.push("Missing media automatically falls back to the landing");
  await missing.context().close();

  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.consoleErrors, []);
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: report.checks.length, accessibilityScans: report.accessibility.length, errors: report.errors, consoleErrors: report.consoleErrors, media: report.media }));
} finally {
  await autoplayBrowser?.close();
  await browser.close();
}
