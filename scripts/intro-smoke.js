import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const base = process.env.INTRO_BASE_URL || "http://127.0.0.1:4176";
const output = process.env.INTRO_OUTPUT_DIR || "/tmp/ven-intro-qa";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox"],
});
const report = { checks: [], accessibility: [], errors: [], consoleErrors: [] };

async function pageFor(options = {}, expectedMediaError = false) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    ...options,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !expectedMediaError)
      report.consoleErrors.push(message.text());
  });
  await page.route("**/_vercel/insights/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "/* Local intro checks: analytics suppressed. */",
    }),
  );
  return page;
}

async function landingReady(page) {
  await page.waitForFunction(() => document.body.dataset.screen === "entry");
  await page.locator(".entry").waitFor();
  assert.equal(await page.locator("#ven-intro").count(), 0);
  assert.equal(
    await page.evaluate(() =>
      document.documentElement.classList.contains("intro-is-open"),
    ),
    false,
  );
  assert.ok(
    await page.getByRole("button", { name: "AVÍSAME PRIMERO" }).isVisible(),
  );
}

async function scan(page, state) {
  const result = await new AxeBuilder({ page })
    .include("#ven-intro")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  report.accessibility.push({
    state,
    violations: result.violations.map((item) => ({
      id: item.id,
      targets: item.nodes.map((node) => node.target),
    })),
  });
  assert.equal(result.violations.length, 0, `${state}: accessibility`);
}

try {
  for (const width of [1440, 390, 320]) {
    const page = await pageFor({ viewport: { width, height: 900 } });
    let videoRequests = 0;
    page.on("request", (request) => {
      if (request.url().includes("/assets/ven-intro.mp4")) videoRequests++;
    });
    await page.goto(base);
    await page.getByRole("dialog", { name: "Presentación de VOOM" }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".intro-video").evaluate(async (video) => {
      const poster = new Image();
      poster.src = video.poster;
      await poster.decode();
    });
    assert.equal(videoRequests, 0, "No full video download before play");
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.equal(
      await page.locator(".intro-video").evaluate((video) => getComputedStyle(video).objectFit),
      "contain",
    );
    await page.screenshot({ path: `${output}/intro-${width}.png` });
    await scan(page, `start @ ${width}`);
    const footer = await page.locator(".site-footer").evaluate((el) => el.outerHTML);
    await page.getByRole("button", { name: "Reproducir con sonido" }).focus();
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement.classList.contains("intro-skip")),
      true,
    );
    await page.keyboard.press("Enter");
    await landingReady(page);
    assert.equal(await page.evaluate(() => document.activeElement.id), "main");
    assert.equal(
      await page.locator(".site-footer").evaluate((el) => el.outerHTML),
      footer,
    );
    await page.screenshot({ path: `${output}/landing-${width}.png` });
    await page.getByRole("button", { name: "AVÍSAME PRIMERO" }).click();
    assert.equal(await page.locator("#celebrity").getAttribute("aria-invalid"), "true");
    await page.reload();
    await landingReady(page);
    assert.equal(videoRequests, 0, "Skipping and reloading do not fetch the video");
    report.checks.push(`Keyboard skip, form validation, session memory, footer and lazy video @ ${width}`);
    await page.context().close();
  }

  const playing = await pageFor();
  await playing.goto(base);
  await playing.getByRole("button", { name: "Reproducir con sonido" }).click();
  await playing.waitForFunction(() => {
    const video = document.querySelector(".intro-video");
    return video && !video.paused && !video.muted && video.currentTime > 0.25;
  });
  const media = await playing.locator("video").evaluate((video) => {
    video.pause();
    return {
      duration: video.duration,
      muted: video.muted,
      volume: video.volume,
      controls: video.controls,
      captions: video.querySelector('track[kind="captions"]').srclang,
      audioBytes: video.webkitAudioDecodedByteCount,
    };
  });
  assert.ok(media.duration > 8 && media.duration < 9);
  assert.equal(media.muted, false);
  assert.equal(media.volume, 1);
  assert.equal(media.controls, true);
  assert.equal(media.captions, "es");
  if (typeof media.audioBytes === "number") assert.ok(media.audioBytes > 0);
  await playing.screenshot({ path: `${output}/playing-desktop.png` });
  await scan(playing, "playback with native controls");
  await playing.locator("video").evaluate((video) => video.play());
  await playing.locator("#ven-intro").waitFor({ state: "detached", timeout: 20000 });
  await landingReady(playing);
  assert.equal(await playing.evaluate(() => document.activeElement.id), "main");
  report.checks.push("Real unmuted playback, decoded audio, captions, native controls and natural end");
  report.media = media;
  await playing.context().close();

  const escape = await pageFor({ viewport: { width: 390, height: 844 } });
  await escape.goto(base);
  await escape.getByRole("button", { name: "Reproducir con sonido" }).click();
  await escape.waitForFunction(() => document.querySelector("video")?.currentTime > 0);
  await escape.locator("video").evaluate((video) => (window.introTestVideo = video));
  await escape.screenshot({ path: `${output}/playing-mobile.png` });
  await escape.keyboard.press("Escape");
  await landingReady(escape);
  assert.equal(await escape.evaluate(() => window.introTestVideo.paused), true);
  assert.equal(await escape.evaluate(() => window.introTestVideo.getAttribute("src")), null);
  report.checks.push("Escape stops and unloads the video during mobile playback");
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
    await page.goto(base + path);
    await page.locator("h1").waitFor();
    if (options.javaScriptEnabled !== false)
      await page.waitForFunction(() => Boolean(document.body.dataset.screen));
    assert.equal(await page.locator("#ven-intro").count(), 0);
    report.checks.push(`Intro bypass: ${label}`);
    await page.context().close();
  }

  const returning = await pageFor();
  await returning.addInitScript(() =>
    sessionStorage.setItem("ven-receipt", JSON.stringify({
      receipt: "intro-test-only",
      expiresAt: Date.now() + 60000,
    })),
  );
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
  await privateMode.getByRole("button", { name: "Entrar sin vídeo" }).click();
  await landingReady(privateMode);
  report.checks.push("Unavailable session storage still permits the landing");
  await privateMode.context().close();

  const missing = await pageFor({}, true);
  await missing.route("**/assets/ven-intro.mp4", (route) => route.fulfill({ status: 404, body: "" }));
  await missing.goto(base);
  await missing.getByRole("button", { name: "Reproducir con sonido" }).click();
  await missing.locator("#ven-intro").waitFor({ state: "detached" });
  await landingReady(missing);
  report.checks.push("Missing video fails open to the landing");
  await missing.context().close();

  const blocked = await pageFor();
  await blocked.goto(base);
  await blocked.evaluate(() => {
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("Blocked", "NotAllowedError"));
  });
  await blocked.getByRole("button", { name: "Reproducir con sonido" }).click();
  await blocked.locator(".intro-error").waitFor();
  assert.equal(await blocked.getByRole("button", { name: "Reproducir con sonido" }).isEnabled(), true);
  await blocked.getByRole("button", { name: "Entrar sin vídeo" }).click();
  await landingReady(blocked);
  report.checks.push("Playback-policy rejection offers retry and skip without trapping focus");
  await blocked.context().close();

  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.consoleErrors, []);
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: report.checks.length, accessibilityScans: report.accessibility.length, errors: report.errors, consoleErrors: report.consoleErrors, media: report.media }));
} finally {
  await browser.close();
}
