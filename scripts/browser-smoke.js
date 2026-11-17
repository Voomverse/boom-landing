import { memoryBlob } from "../tests/helpers/memory-blob.js";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { handleSignup } from "../server/signup.js";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:4173";
const evidence = process.env.QA_OUTPUT_DIR || "/tmp/ven-qa";
mkdirSync(evidence, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox"],
});
const storage = memoryBlob();
const records = storage.writes;
const env = {
  BLOB_READ_WRITE_TOKEN: "test-only-in-memory-token",
  VITE_PRIVACY_POLICY_URL: "https://example.com/privacy",
};
const errors = [];
const results = [];
async function checked(page, name) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    `${name}: horizontal overflow`,
  );
  results.push(name);
}
async function fill(page, device) {
  await page.locator("#celebrity").fill("Rosalía");
  await page.locator("#email").fill(`browser-test+${device}@example.com`);
  await page.locator("#adult").check();
  await page.locator("#consent").check();
}
try {
  for (const [device, width, height] of [
    ["desktop", 1440, 1140],
    ["mobile", 390, 1320],
    ["small-mobile", 320, 850],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    await checked(page, `${device} entry`);
    if (device !== "small-mobile")
      await page.screenshot({
        path: `${evidence}/${device}-entry.png`,
        fullPage: true,
      });
    // Real local server without configured storage must reject, not fake a conversion.
    const unavailable = await page.request.post(`${base}/api/signup`, {
      data: { action: "signup" },
    });
    assert.equal(unavailable.status(), 503);
    await page.getByRole("button", { name: "AVÍSAME PRIMERO" }).click();
    assert.equal(
      await page.locator("#celebrity").getAttribute("aria-invalid"),
      "true",
    );
    assert.equal(await page.locator("#email-error").isVisible(), true);
    assert.equal(await page.locator("#consent-error").isVisible(), true);
    await page.locator("#celebrity").fill("Rosalía");
    await page.locator("#email").fill("invalid");
    await page.getByRole("button", { name: "AVÍSAME PRIMERO" }).click();
    assert.equal(await page.locator("#email-error").isVisible(), true);
    if (device === "mobile")
      await page.screenshot({
        path: `${evidence}/mobile-errors.png`,
        fullPage: true,
      });
    await fill(page, device);
    await page.getByRole("button", { name: "AVÍSAME PRIMERO" }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "todavía no están abiertas" })
      .waitFor();
    assert.equal(await page.locator(".signup").isVisible(), true);
    results.push(`${device} validation + real unconfigured API error`);
    // Exercise the real handler with an injected in-memory private storage adapter.
    await page.route("**/api/signup", async (route) => {
      const request = route.request();
      const result = await handleSignup(
        {
          method: request.method(),
          headers: {
            "content-type": "application/json",
            host: new URL(base).host,
            origin: base,
          },
          body: request.postData(),
        },
        {
          env,
          ...storage,
        },
      );
      await route.fulfill({
        status: result.status,
        contentType: "application/json",
        body: JSON.stringify(result.body),
      });
    });
    await page.getByRole("button", { name: "AVÍSAME PRIMERO" }).click();
    await page.getByText("Hecho. Ya estás en VEN.").waitFor();
    await checked(page, `${device} offer`);
    if (device !== "small-mobile")
      await page.screenshot({
        path: `${evidence}/${device}-offer.png`,
        fullPage: true,
      });
    const savedReceipt = await page.evaluate(() =>
      sessionStorage.getItem("ven-receipt"),
    );
    await page.evaluate(() => sessionStorage.removeItem("ven-receipt"));
    await page.reload();
    await fill(page, device);
    await page.getByRole("button", { name: "AVÍSAME PRIMERO" }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Este email ya está en VEN" })
      .waitFor();
    assert.equal(await page.locator(".signup").isVisible(), true);
    results.push(`${device} duplicate email rejected without advancing`);
    await page.evaluate(
      (receipt) => sessionStorage.setItem("ven-receipt", receipt),
      savedReceipt,
    );
    await page.reload();
    await page.getByText("Hecho. Ya estás en VEN.").waitFor();
    results.push(`${device} reload resumes signed receipt`);
    // First selection fails; preserve the offer and let the visitor retry.
    await page.route("**/api/signup", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Error de prueba. Inténtalo de nuevo." }),
      }),
    );
    await page.getByRole("button", { name: "OFERTA VEN", exact: true }).click();
    await page.getByText("Error de prueba. Inténtalo de nuevo.").waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "OFERTA VEN", exact: true })
        .isEnabled(),
      true,
    );
    await page.unroute("**/api/signup");
    await page.route("**/api/signup", async (route) => {
      const result = await handleSignup(
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: route.request().postData(),
        },
        { env, ...storage },
      );
      await route.fulfill({
        status: result.status,
        contentType: "application/json",
        body: JSON.stringify(result.body),
      });
    });
    await page
      .getByRole("button", {
        name: device === "mobile" ? "Todavía ninguno" : "OFERTA VEN",
        exact: true,
      })
      .click();
    await page
      .getByRole("heading", {
        name: device === "mobile" ? "SIN PROBLEMA." : "APUNTADO.",
      })
      .waitFor();
    await checked(page, `${device} preference confirmation`);
    if (device !== "small-mobile")
      await page.screenshot({
        path: `${evidence}/${device}-confirmation.png`,
        fullPage: true,
      });
    await page.reload();
    await page.locator("#celebrity").waitFor();
    const policyTabPromise = page.waitForEvent("popup");
    await page
      .getByRole("link", { name: "Política de privacidad", exact: true })
      .first()
      .click();
    const policyTab = await policyTabPromise;
    policyTab.on("pageerror", (e) => errors.push(e.message));
    await policyTab.waitForLoadState("networkidle");
    assert.equal(new URL(policyTab.url()).pathname, "/privacidad/");
    await policyTab
      .getByRole("heading", { name: "Política de privacidad", exact: true })
      .waitFor();
    assert.equal(await policyTab.locator("article h2").count(), 11);
    const policyText = await policyTab.locator("article").innerText();
    assert.ok(policyText.includes("Vercel Blob"));
    assert.ok(policyText.includes("24 horas"));
    assert.ok(!policyText.includes("First Look"));
    await checked(policyTab, `${device} bundled privacy page`);
    if (device !== "small-mobile")
      await policyTab.screenshot({
        path: `${evidence}/${device}-privacy.png`,
        fullPage: true,
      });
    await policyTab
      .getByRole("link", { name: "Volver a VEN", exact: true })
      .first()
      .click();
    await policyTab.locator("#celebrity").waitFor();
    await policyTab.close();
    for (const path of ["/secreto", "/antes-de-morir", "/quanta"]) {
      await page.goto(base + path);
      await page.locator("#celebrity").waitFor();
      await page.evaluate(() => document.fonts.ready);
      await checked(page, `${device} ${path}`);
      if (device === "mobile")
        await page.screenshot({
          path: `${evidence}/mobile${path}.png`,
          fullPage: true,
        });
    }
    await page.close();
  }
  assert.equal(
    records.filter((record) => record[0].startsWith("signups/")).length,
    3,
  );
  assert.equal(
    records.filter((record) => record[0].startsWith("preferences/")).length,
    3,
  );
  assert.equal(errors.length, 0, JSON.stringify(errors));
  writeFileSync(
    `${evidence}/browser-results.json`,
    JSON.stringify(
      {
        results,
        pageErrors: errors,
        privateTestWrites: records.length,
        storage: "in-memory adapter; no live Blob store tested",
      },
      null,
      2,
    ),
  );
  console.log(
    `Passed ${results.length} browser checks. No page errors. ${records.length} writes to in-memory test storage. Evidence: ${evidence}`,
  );
} finally {
  await browser.close();
}
