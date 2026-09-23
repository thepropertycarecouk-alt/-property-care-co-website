# PCCO website — production source

Status: **live in production from 23 September 2026**.

## Architecture and editing

Vanilla HTML, CSS and JavaScript. `public/stays/index.html` is the editable PCCO Stays page; `npm run build` also writes it to `public/index.html` and copies `public` into `dist`. Stays code and assets are isolated under `public/stays/`. No npm dependencies are required to build.

`public/cleans/index.html` started from the live cleaning homepage retrieved on 23 September 2026. The Cleaning-only refinement removes the duplicated accommodation introductions, keeps the page focused on Cleaning & Property Care, and sends the Accommodation navigation link to `/`. `public/cleans/refinements.css` contains the isolated visual refinements. Existing integration scripts, control IDs, option values and pricing were preserved.

The Stays root handles existing `?lead=`, `?monthly=` and cleaning bookmark return links by forwarding them to `/cleans`, preserving query and hash. Existing Stripe backend return links therefore remain compatible.

## Production routes

- `/` — PCCO Stays
- `/cleans` — Cleaning & Property Care
- Existing legacy B2B/accommodation pages remain in `public/` for compatibility.

The Stays header Cleaning link points to `/cleans`. The Cleaning desktop and mobile Accommodation links point back to `/`.

## Logos and imagery

Final supplied logo PNGs are stored in `public/stays/assets/`. Header: `02_Transparent_Landscape_Logo.png`; footer: `01_Website_Horizontal_Navy.png`. The supplied PNG assets were committed to GitHub rather than recreated. The Stays hero image is `public/stays/assets/living-room.jpg`.

## Accommodation enquiries

`public/stays/app.js` submits JSON directly to the existing `pcc-accommodation` Supabase Edge Function in project `pgbwbklqvyyzipbxcdvx`. The function stores accommodation enquiries separately and handles owner/customer email delivery. No backend table or function change was required for the production launch.

The three-step brief supports validation, dates TBC, budget, parking, cleaning, review, WhatsApp/phone fallback and a downloadable brief. Successful server response is required before the submitted receipt is shown.

`public/stays/properties.json` is intentionally empty. `property.schema.json` documents the future approved inventory fields. Do not add fabricated properties.

## Cleaning / Stripe / Supabase

The Cleaning page continues to call the existing `pcc-public` function. Its actions include `create_estimate`, `availability`, `request_booking` and `create_monthly_checkout`. Stripe payment processing remains in the existing managed Supabase Edge Functions/webhook. Do not move Stripe secrets into browser code or alter live pricing unless the business explicitly approves a pricing change.

Server-side secrets remain in the existing managed secret store. The static frontend requires no secret environment variables.

## Development and tests

Run:

```bash
npm run dev
npm run build
```

Local URL: `http://localhost:4173/`.

`scripts/verify.cjs` covers Stays at desktop/tablet/mobile widths with mocked submission. `scripts/verify-cleaning.cjs` covers the existing Cleaning UI, monthly prices and mocked estimate/booking/checkout flows. They use Playwright and a Chromium path documented in those scripts.

A separate real accommodation submission was previously verified end-to-end with reference `PCCO-STAYS-QA-20260923`; see `VERIFICATION.md`.

## Repository and deployment

Source of truth:
- Repository: `thepropertycarecouk-alt/-property-care-co-website`
- Production branch: `main`
- Working/launch branch retained: `pcco-stays-production`
- First validated PCCO Stays production source commit: `97215623f8b0088aa8699709b62949449c83c36d`

Vercel:
- Project: `pcc-live-site-260825`
- Project ID: `prj_32BDhNcZMrqs2JvLGZiAl5FdlFW8`
- Team ID: `team_dQ4Q5IIRCbOwBlQxQYUlILTA`
- Production is connected to GitHub `main`.
- Production aliases include `www.thepropertycareco.co.uk`, `thepropertycareco.co.uk` and `pcc-live-site-260825.vercel.app`.

The pre-Stays Cleaning production deployment `dpl_5qqJHjWripY8opY5izQe6pXSijkx` remains an identified rollback reference.

## Production safety

Before changing production:
1. Make the change in source, not directly in the deployed output.
2. Keep Stays changes under `public/stays/` and Cleaning-specific changes under `public/cleans/` where possible.
3. Run `npm run build`.
4. Verify `/` and `/cleans`, including mobile layouts and the relevant form/payment path.
5. Commit to a branch first for any substantial change; use a Vercel preview before merging to `main`.
6. Confirm the GitHub commit SHA shown by Vercel matches the intended source.

Do not reintroduce the private-preview banner or `noindex` on the public production root. `public/robots.txt` currently allows crawling.

## Known item

`/privacy.html` and `/terms.html` returned 404 in the baseline and remain a known content gap. Do not fabricate legal copy; add those pages only from approved text.
