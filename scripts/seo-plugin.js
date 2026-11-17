import { variants } from "../shared/campaigns.js";
import { renderEntry } from "../shared/render-entry.js";
import { renderInformation, footerDetails } from "../shared/site-content.js";
import { pages, siteOrigin, metadata } from "../shared/seo.js";

export function seoPlugin(env) {
  const end = env.VITE_CAMPAIGN_END;
  const expired = Boolean(
    end && Number.isFinite(Date.parse(end)) && Date.now() > Date.parse(end),
  );
  const entry = (page) =>
    renderEntry(variants[page.variant], { expired, variantKey: page.variant });
  const head = (page) => `<!--seo-start-->${metadata(page)}<!--seo-end-->`;
  return {
    name: "static-search-content",
    enforce: "post",
    transformIndexHtml: {
      order: "pre",
      handler(html, context) {
        const page =
          pages.find(
            (page) =>
              page.path === context.path ||
              page.path === context.path.replace(/index\.html$/, ""),
          ) ||
          (context.filename.endsWith("privacidad/index.html")
            ? pages.at(-1)
            : pages[0]);
        return html
          .replace("<!--seo-head-->", head(page))
          .replace("<!--app-entry-->", page.variant ? entry(page) : "")
          .replace("<!--site-info-->", renderInformation())
          .replace("<!--footer-details-->", footerDetails());
      },
    },
    generateBundle(options, bundle) {
      const root = bundle["index.html"];
      if (!root || root.type !== "asset")
        throw new Error("Prerender failed: root HTML is missing.");
      for (const page of pages.filter(
        (page) => page.variant && page.path !== "/",
      )) {
        const html = String(root.source)
          .replace(/<!--seo-start-->[\s\S]*?<!--seo-end-->/, head(page))
          .replace(
            /<!--entry-start-->[\s\S]*?<!--entry-end-->/,
            `<!--entry-start-->${entry(page)}<!--entry-end-->`,
          );
        this.emitFile({
          type: "asset",
          fileName: page.path.slice(1) + "index.html",
          source: html,
        });
      }
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${siteOrigin}${page.path}</loc></url>`).join("\n")}\n</urlset>\n`,
      });
    },
  };
}
