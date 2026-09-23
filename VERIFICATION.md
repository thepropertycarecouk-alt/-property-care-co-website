# Verification — 23 September 2026

## Production launch

- PCCO Stays is live at `https://www.thepropertycareco.co.uk/` and returned HTTP 200 during post-launch verification.
- Cleaning & Property Care is live at `https://www.thepropertycareco.co.uk/cleans` and returned HTTP 200.
- The Vercel production deployment `dpl_J5HvvFGYxZMir1jJB1KBY32swrJp` reached `READY` from GitHub `main` commit `97215623f8b0088aa8699709b62949449c83c36d`.
- Production aliases include both company domains and the project Vercel URL.
- The launch deployment reported no alias error.
- Vercel's runtime-error scan returned no runtime errors in the first-hour post-launch check.
- The private-preview banner and `noindex` are absent from the public root.
- `robots.txt` returns `User-agent: * / Allow: /`.

## Stays

- Stays browser checks previously passed at 1440x1000, 768x1024 and 390x844, with a 320px overflow check.
- Checked quick enquiry, six service paths, validation, date order, dates TBC, three-step navigation, review, submission payload, download, privacy dialog, WhatsApp link and mobile menu.
- A real `pcc-accommodation` response previously returned 200 with `ok=true`; the database row was verified and both test emails were reported delivered. Test reference: `PCCO-STAYS-QA-20260923`.
- Production `/stays/app.js`, `/stays/styles.css`, header logo, footer logo and hero image all returned HTTP 200 after launch.
- The four final supplied logo PNGs are present in GitHub under `public/stays/assets/`.
- No fake properties are published; `public/stays/properties.json` remains intentionally empty.
- The production root contains a Cleaning link to `/cleans`.

## Cleaning, Supabase and Stripe

- Cleaning regression checks previously passed at desktop, tablet and mobile widths for all five service selectors, monthly price bands, mocked estimate/availability/booking and checkout requests, plus root payment-return forwarding.
- Production Cleaning still contains the `pcc-public` endpoint and `create_monthly_checkout` action.
- Supabase project `pgbwbklqvyyzipbxcdvx` was `ACTIVE_HEALTHY` during launch verification.
- `pcc-public`, `pcc-accommodation` and `pcc-stripe-webhook` were all `ACTIVE`.
- The production launch did not replace or redeploy those backend functions.
- No payment was charged as part of this launch verification. The source-preservation and backend-status checks confirm the checkout integration path remains present; they do not constitute a new live payment settlement test.

## Known item

- `/privacy.html` and `/terms.html` were already 404 in the baseline. Approved legal copy was not supplied, so no legal pages were fabricated.
