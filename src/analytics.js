import { inject } from "@vercel/analytics";

if (import.meta.env.PROD) {
  inject({
    mode: "production",
    debug: false,
    beforeSend(event) {
      try {
        const url = new URL(event.url, window.location.origin);
        // Keep page-view statistics free of query-string and fragment contents.
        return { ...event, url: `${url.origin}${url.pathname}` };
      } catch {
        return null;
      }
    },
  });
}
