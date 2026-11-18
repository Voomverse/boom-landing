import { socialProfiles } from "../shared/socials.js";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { pages, siteOrigin } from "../shared/seo.js";

const base = process.env.QUALITY_BASE_URL || "http://127.0.0.1:4176";
const output = process.env.QUALITY_OUTPUT_DIR || "/tmp/ven-site-quality";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox"],
});
const report = {
  crawlChecks: [],
  accessibility: [],
  keyboard: [],
  failures: [],
};
try {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const titles = new Set();
  for (const target of pages) {
    const response = await page.goto(base + target.path);
    assert.equal(response.status(), 200, target.path);
    assert.equal(
      await page.locator("h1").count(),
      1,
      `${target.path}: one initial-HTML H1`,
    );
    const title = await page.title();
    assert.ok(
      title.length >= 30 && title.length <= 65,
      `${target.path}: descriptive title`,
    );
    assert.ok(!titles.has(title), `${target.path}: unique title`);
    titles.add(title);
    assert.equal(
      await page.locator('link[rel="canonical"]').getAttribute("href"),
      siteOrigin + target.path,
    );
    assert.equal(await page.locator('meta[name="description"]').count(), 1);
    assert.equal(
      await page.locator('meta[property="og:url"]').getAttribute("content"),
      siteOrigin + target.path,
    );
    const schema = JSON.parse(
      await page.locator('script[type="application/ld+json"]').textContent(),
    );
    assert.ok(
      schema["@graph"].some(
        (item) => item["@type"] === "Organization" && item.name === "Voomverse",
      ),
    );
    const activeProfiles = socialProfiles.filter(
      (profile) => profile.href !== "#",
    );
    assert.deepEqual(
      schema["@graph"].find((item) => item["@type"] === "Organization").sameAs,
      activeProfiles.map((profile) => profile.href),
    );
    for (const profile of activeProfiles) {
      const link = page.locator(`.social-links a[href="${profile.href}"]`);
      assert.equal(await link.getAttribute("target"), "_blank");
      assert.equal(await link.getAttribute("aria-disabled"), null);
      assert.ok((await link.getAttribute("rel")).includes("noopener"));
    }
    assert.equal(await page.locator("img:not([alt])").count(), 0);
    if (target.variant) {
      const answers = page.locator("#preguntas-frecuentes .faq-answer");
      assert.equal(await answers.count(), 5);
      for (const answer of await answers.all())
        assert.equal(await answer.isVisible(), true);
      assert.ok(
        (await page.locator("main").innerText()).split(/\s+/).length > 300,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "AVÍSAME PRIMERO" })
          .isDisabled(),
        true,
      );
      assert.equal(
        await page
          .locator('.social-links a[aria-disabled="true"][href="#"]')
          .count(),
        socialProfiles.filter((profile) => profile.href === "#").length,
      );
    }
    report.crawlChecks.push(target.path);
  }
  const sitemap = await (await page.request.get(base + "/sitemap.xml")).text();
  for (const target of pages)
    assert.ok(sitemap.includes(`<loc>${siteOrigin}${target.path}</loc>`));
  for (const file of ["/robots.txt", "/llms.txt", "/agents.txt"])
    assert.equal((await page.request.get(base + file)).status(), 200);
  await context.close();

  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      // Scan the landing states; the intro has separate accessibility checks.
      reducedMotion: "reduce",
    });
    // These checks run locally; do not send synthetic visits to production analytics.
    await context.route("**/_vercel/insights/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "/* Local accessibility audit: analytics collection suppressed. */",
      }),
    );
    const page = await context.newPage();
    for (const target of pages) {
      await page.goto(base + target.path);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `${target.path} @ ${width}: overflow`,
      );
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      report.accessibility.push({
        path: target.path,
        width,
        violations: axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
      if (target.path === "/" && width !== 320)
        await page.screenshot({
          path: `${output}/${width}-home.png`,
          fullPage: true,
        });
    }
    await page.goto(base + "/");
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() =>
        document.activeElement?.classList.contains("skip-link"),
      ),
      true,
    );
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "main");
    const faqEmail = page.locator(
      '#preguntas-frecuentes a[href="mailto:legal@voomverse.com"]',
    );
    await faqEmail.focus();
    assert.equal(
      await faqEmail.evaluate((el) => el.matches(":focus-visible")),
      true,
    );
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() =>
        document.activeElement.matches("#preguntas-frecuentes .privacy-link"),
      ),
      true,
    );
    await page.goto(base + "/#sobre-nosotros");
    await page.locator("#celebrity").waitFor();
    assert.equal(await page.evaluate(() => location.hash), "#sobre-nosotros");
    // Check validation and the post-signup offer without contacting private storage.
    await page.goto(base + "/");
    await page.getByRole("button", { name: "AVÍSAME PRIMERO" }).click();
    const errorsAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    report.accessibility.push({
      path: "/ (validation errors)",
      width,
      violations: errorsAxe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
    await page.evaluate(() =>
      sessionStorage.setItem(
        "ven-receipt",
        JSON.stringify({
          receipt: "accessibility-test-only",
          expiresAt: Date.now() + 60000,
        }),
      ),
    );
    await page.reload();
    await page.getByText("Hecho. Ya estás en VEN.").waitFor();
    const offerAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    report.accessibility.push({
      path: "/ (offer)",
      width,
      violations: offerAxe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
    report.keyboard.push(width);
    await context.close();
  }
  const failures = report.accessibility.filter(
    (item) => item.violations.length,
  );
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        pagesWithoutJavaScript: report.crawlChecks.length,
        accessibilityScans: report.accessibility.length,
        keyboardWidths: report.keyboard,
        violations: failures,
      },
      null,
      2,
    ),
  );
  assert.equal(
    failures.length,
    0,
    "Accessibility violations remain; see report.",
  );
} catch (error) {
  report.failures.push(error.message);
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  throw error;
} finally {
  await browser.close();
}
