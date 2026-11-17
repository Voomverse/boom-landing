# VEN · VOOM

Responsive Spanish landing for **voomverse.com**, built from the supplied 11-page VEN PDF. Static HTML/CSS/JavaScript with Vite, plus one Vercel function. No database server, AWS infrastructure, analytics, external fonts, or browser storage of email addresses.

## Run locally

Use Node 22.12+ (Node 24 verified).

```sh
npm ci
npm run dev
```

`npm run build` creates `dist/`. `npm test` tests the signup API. The development server includes the same API handler as production. Without a connected private Blob store and a privacy-policy URL, the form returns an honest “inscriptions not open” message. It never simulates a saved signup.

## Deploy to Vercel

1. Push these files to `Voomverse/boom-landing`, then import that repository at https://vercel.com/new. The included `vercel.json` supplies the Vite build settings. Alternatively, run `npx vercel --prod` in this directory to deploy directly without a Git push (Vercel sign-in required).
2. In the Vercel project's **Storage** tab, create/connect a **private Vercel Blob store**. Connect it to Production (and Preview if you want preview submissions). Vercel supplies `BLOB_READ_WRITE_TOKEN`. Never prefix that token with `VITE_`.
3. In **Settings → Environment Variables**, set `VITE_PRIVACY_POLICY_URL` to your real, published HTTPS privacy-policy URL. Optionally set `VITE_CAMPAIGN_END` to an ISO timestamp with a timezone, e.g. `2026-12-31T23:59:59+01:00`. An omitted closing date hides the deadline, rather than showing the PDF's placeholder. Redeploy after setting variables or connecting storage.
4. In **Settings → Domains**, add `voomverse.com` and `www.voomverse.com`. Choose the apex as primary and redirect `www` to it. Copy the exact DNS records Vercel supplies into your domain provider. Vercel provisions HTTPS.
5. Submit a real test signup; check its JSON record under `signups/` in the private Blob store, choose a plan, and check the matching record under `preferences/`. Delete those test records from the dashboard afterward.

Vercel Hobby is intended for personal, non-commercial projects. Check the current plan terms for this business landing; Vercel Pro may be required. No paid resources or deployment have been created by this repository.

For automated deployments after the first import, pushing the connected production branch rebuilds the site. No secrets belong in Git. Build-time public variables require a redeployment to update the page.

## Campaign URLs

| URL | Entry variant |
| --- | --- |
| `/` | VEN |
| `/secreto` | SECRETO |
| `/antes-de-morir` | ANTES DE MORIR / Golden Ticket |
| `/quanta` | QUANTA |

`/?variant=quanta` (and the corresponding variant names) is also supported. Every entry submits to the QUANTA offer; selecting a plan saves intent only. There is no checkout or payment. The PDF's separate “HECHO.” screen is represented by the signup-success banner before the offer, so the flow has no dead-end confirmation page.

## Data and signup behavior

- The server validates the name, email, campaign, age declaration, and marketing consent. Both consent boxes start unchecked.
- Signups are private JSON objects in `signups/YYYY-MM-DD/UUID.json`, with campaign and consent details. Plan preferences are separate private records associated with that signup ID. If multiple preferences exist, the latest timestamp wins on export.
- The API returns a signed, 24-hour receipt only after storage succeeds. It never returns email addresses or Blob URLs. The receipt lets the same browser select a plan and resume the offer after refreshing.
- A storage outage displays an error and lets the visitor retry. No transactional email is sent; this is the waitlist capture, not an email delivery system.
- The API enforces a 4 KB request limit, JSON content type, same-origin browser requests, a honeypot field, server-side campaign deadlines, and signed plan selection. For public ad traffic, configure rate limiting in Vercel Firewall as appropriate for the campaign volume; the app does not claim distributed bot protection or guaranteed free-tier capacity.
- The privacy policy must cover the actual operator and intended processing. No legal policy has been invented. The app won't accept registrations until the real policy URL and storage token are configured.
- No deduplication is applied to preserve separate campaign responses; deduplicate email addresses before marketing sends. Manage retention/deletion through the private store. Only project administrators should access it.

## Export your list

Use a local, secure `.env.local` containing the connected store token (for example retrieved with `npx vercel env pull .env.local` after linking the project). Then:

```sh
node --env-file=.env.local scripts/export-signups.js
```

This downloads private records, joins the latest plan choice, and writes a private, Git-ignored `signups-YYYY-MM-DD.csv`. Exports are exclusive-create to avoid overwriting previous exports. `npm run export:signups` also works when the token is already in the process environment. Treat the CSV as personal data. Export needs network access to Vercel Blob and has not been validated against a live store without credentials.

## Design and assets

The logo, VEN wordmark, planet, keyhole, ticket, password, door, footer mark, and wave artwork are extracted from the supplied PDF and served locally as optimized WebP. Text and controls are live HTML. Fonts are self-hosted open-source Jost, Barlow Condensed, and Anton (SIL Open Font License); outline UI icons use Lucide (ISC). The original custom geometric heading font was not supplied; Jost is the geometric fallback. Included font/icon licenses are at `/asset-licenses.txt`. The design QA report records the visual evidence and remaining limitations.

## Browser checks

With the dev server running, run `npm run test:browser`. Install Chromium with `npx playwright install chromium` if there is no system Chromium. The suite tests validation, API failure handling, the signup-to-offer-to-choice flow, refresh recovery, policy dialog, campaign variants, 320/390/1440 px layouts, and JavaScript page errors. Successful writes use the actual handler with an in-memory storage adapter, not a live Vercel store. Screenshots and results go to `/tmp/ven-qa` (override `QA_OUTPUT_DIR`).
