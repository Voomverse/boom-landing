# VEN · VOOM

A responsive Spanish landing page and signup flow for VOOM. Built with Vite and plain HTML, CSS, and JavaScript, with one Vercel function and private Vercel Blob storage.

## Local development

Node.js 22.12 or later is required. Node 24 is supported.

```sh
npm ci
npm run dev
```

The development server includes the signup API. Without a storage token it displays the landing but rejects signup submissions instead of simulating success.

## Deploy

Import this GitHub repository into Vercel. The build settings are included in `vercel.json`. Pushes to the connected production branch trigger new deployments.

Connect a **private** Vercel Blob store to the project's Production environment. Vercel provides `BLOB_READ_WRITE_TOKEN`; redeploy after connecting the store. A public GitHub repository does not make the private Blob store public.

The site includes its own privacy policy at `/privacidad/`. No privacy-policy environment variable is required for the default setup.

| Variable                  | Purpose                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `BLOB_READ_WRITE_TOKEN`   | Required server-only credential supplied by the connected private Blob store.                     |
| `VITE_PRIVACY_POLICY_URL` | Optional public HTTPS URL overriding the included policy page. Leave unset to use `/privacidad/`. |
| `VITE_CAMPAIGN_END`       | Optional campaign deadline as an ISO timestamp with timezone. Omit to hide the deadline.          |

After changing environment variables, redeploy. Add your custom domain in Vercel's project settings and follow the DNS records Vercel provides.

Vercel's plan eligibility and usage limits are separate from GitHub repository visibility. Check the current Vercel terms for commercial use before choosing a plan.

## Pages and flow

| Path              | Content             |
| ----------------- | ------------------- |
| `/`               | VEN entry           |
| `/secreto`        | SECRETO entry       |
| `/antes-de-morir` | Golden Ticket entry |
| `/quanta`         | QUANTA entry        |
| `/privacidad/`    | VEN privacy policy  |

The form collects an email, a celebrity interest, and explicit age/marketing-consent declarations. A successful save leads to the QUANTA offer, where selecting a plan records a preference. There is no checkout, payment, account registration, or automatic email delivery.

Signup and preference records remain in private storage. A signed receipt held in browser session storage allows plan selection and refresh recovery for up to 24 hours; it does not contain the email or celebrity response. The API validates requests and reports storage failures without presenting a success screen.

The privacy policy describes VEN's actual fields, purposes, Vercel storage, consent, retention, rights, and technical browser storage. It uses the company and privacy-contact details published in VOOM's existing policy. Keep the policy and consent version aligned with future changes to the form, providers, or marketing operations.

## Public repository and credentials

- Put real credentials in Vercel environment settings or an ignored local `.env.local` file. Never paste them into source, documentation, issues, or commits.
- Variables beginning with `VITE_` are public browser configuration. Never use that prefix for a secret.
- `.env.example` contains blank fields only. `.env*` files, `.vercel/`, dependencies, generated builds, logs, and signup exports are ignored by Git.
- Test tokens and email addresses in the test suite are synthetic fixtures. Production records and credentials are not needed to run tests.
- Do not publish exported signup data or production logs. If a real credential is accidentally committed, revoke/rotate it; deleting it from the latest file does not remove it from Git history.

## Validation

```sh
npm test
npm run build
```

For browser checks, start the dev server on port 4173 and run:

```sh
npm run dev -- --port 4173 --strictPort
# In another terminal:
npm run test:browser
```

Install Chromium with `npx playwright install chromium` if no system Chromium is available. The suite covers form errors, failed saves, signup and plan selection, refresh recovery, campaign routes, the privacy page, and desktop/mobile layouts. Successful test writes use the real API handler with in-memory test storage, not production Blob storage. Screenshots are generated locally; `QA_OUTPUT_DIR` controls their destination.

For a production smoke test, submit a test signup, select a plan, verify both records in the private Blob dashboard, then delete the test records. Automated tests do not prove production storage connectivity.

## Private export

With the store token loaded securely in the local process environment:

```sh
npm run export:signups
```

The script creates a Git-ignored CSV joining signup records to their latest plan preferences. Keep that file private. It never prints the token or signup contents to the console.

## Assets

Brand artwork is supplied locally. Fonts (Jost, Barlow Condensed, Anton) and outline icons (Lucide) are self-hosted/bundled. Their licenses are included in `public/asset-licenses.txt`.
