# PCCO website — production candidate

Status: prepared locally; production domain unchanged. This is not a completed production launch.

## Architecture and editing
Vanilla HTML, CSS and JavaScript. `public/stays/index.html` is the editable Stays page; `npm run build` also writes it to `public/index.html` and copies `public` into `dist`. Stays code and assets are isolated under `public/stays/`. No npm dependencies are required to build.

`public/cleans/index.html` started from the live cleaning homepage retrieved on 23 September 2026. The user subsequently requested a light Cleaning-only redesign: duplicate accommodation sections removed, navigation simplified with Accommodation linking to `/`, and isolated `public/cleans/refinements.css` added. Original integration scripts, control IDs, option values and pricing are preserved. Baseline SHA256: 2e4265863ed11eafabee17d4c940b5685ca3c26c8e45401c0bd2fdd5400a8016. Root-level legacy accommodation pages, b2b scripts/styles and brand assets are retained. Their Cleaning navigation now points to `/cleans#cleaningDivision`.

Stays root handles existing `?lead=`, `?monthly=` and cleaning bookmark return links by forwarding them to `/cleans`, preserving query and hash. Stripe backend return URLs therefore require no changes. The existing billing portal's generic return to the company homepage will show Stays after launch.

## Logos
The four final PNGs are in `public/stays/assets/`, with their supplied names. PNG bytes are unchanged. Header: `02_Transparent_Landscape_Logo.png`; footer: `01_Website_Horizontal_Navy.png`. CSS uses proportional sizing and object-fit contain; no AI alterations, cropping or colour filters.

## Accommodation enquiries
`public/stays/app.js` submits JSON directly to the existing `pcc-accommodation` edge function on Supabase project `pgbwbklqvyyzipbxcdvx`. The existing function stores enquiries separately in `accommodation_enquiries`, sends owner notification and customer confirmation with Resend. No backend functions or tables were changed. Contact number is +44 7411 251361.

Validation, dates TBC, budget, parking, cleaning and review use the existing three-step form. Successful server response is required before showing receipt. Failed or uncertain delivery retains input and offers WhatsApp/phone. Submit is locked while pending. Extra requirements are included in `details` (server limit 3000 characters). Email and WhatsApp follow-ups include the brief. Unsubmitted data is kept only in page memory.

`public/stays/properties.json` is intentionally empty. `property.schema.json` documents the future approved inventory fields. No fake listings are present. A future renderer can use the existing property-list container and source actual approved data.

## Cleaning / Stripe
The cleaning page calls the existing `pcc-public` function. Actions include create_estimate, availability, request_booking and create_monthly_checkout. Payment processing remains in the existing Stripe edge functions and webhook. Do not replace these functions or alter pricing tables when editing Stays. No payment was charged in QA.

Server environment names referenced by the existing functions include SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Other service credentials remain in the existing managed secret store; no values are included here. The static frontend needs no secret environment variables. Never expose service-role, Stripe or Resend keys in browser code.

## Development and tests
Run `npm run dev`, open http://localhost:4173/. Build with `npm run build`.
`scripts/verify.cjs` checks Stays at 1440, 768, 390 and 320 px with mocked submission; `scripts/verify-cleaning.cjs` checks existing cleaning UI, monthly prices and mocked estimate/booking/checkout. They require Playwright through CODEX_PRIMARY_RUNTIME_NODE_MODULES and Chromium at the path documented in those scripts. Adjust the local browser path when using a different machine.

A separate real accommodation submission succeeded, was stored, and both emails were reported delivered. Test reference PCCO-STAYS-QA-20260923. See VERIFICATION.md for the precise limits of testing.

## Repository and deployment
Requested source of truth: https://github.com/thepropertycarecouk-alt/-property-care-co-website, main. Existing remote commit at inspection: 9ba386a9ad76b2373e95c3688b9de33fc10d7733. Creating working branch pcco-stays-production was denied by GitHub: Resource not accessible by integration (403). No GitHub production commit has been made. Restore the GitHub connection's repository write access before proceeding; do not treat the local/Sites commit as a GitHub commit.

Existing Vercel project: pcc-live-site-260825, project prj_32BDhNcZMrqs2JvLGZiAl5FdlFW8, team team_dQ4Q5IIRCbOwBlQxQYUlILTA. Existing production deployment to preserve for rollback: dpl_5qqJHjWripY8opY5izQe6pXSijkx. No production deployment or domain change was performed.

Before launch: obtain the current full deployment configuration/source, reconcile it with this candidate (the GitHub source was older than live), commit all source to GitHub, stage and verify `/cleans` first, verify live Stripe checkout and email return paths without charging, deploy root Stays only after those gates pass. Use the existing Vercel project with output directory dist and build command npm run build. Preserve existing routes/configuration. Remove the private-preview banner and noindex only for the public production build. Confirm GitHub integration deployment branch with Vercel, not merely a one-off upload.

Known existing public issues: /privacy.html and /terms.html returned 404 before changes. Do not fabricate legal pages. Obtain the approved text or locate the intended pages before final production QA.

Keep Stays changes within its folder and rebuild. Keep cleaning edits isolated in cleans and its original shared assets; compare its scripts/prices with the saved baseline. Re-run both test sets whenever root routing or shared assets change.
