# PCCO Partners — 25 September 2026

## Implementation
- New public route: `/partners` (`public/partners/index.html`, `partners.css`, `partners.js`).
- Navigation only changed in `public/stays/index.html` and generated `public/index.html`; existing Cleaning and accommodation scripts/styles unchanged.
- Existing assets/design tokens reused. Page-scoped mobile typography and layout.
- Founding rate: first 200 approved properties that go live, 7.8% + VAT locked 12 months; no future rate invented.
- Short form allows up to 10 public HTTP(S) links, with server/client email, phone and URL validation, existing honeypot and rate limiting.
- `supabase/functions/pcc-accommodation/index.ts` preserves customer requirement processing and adds a `website_partners` source branch. Provider emails route to partners@thepropertycareco.co.uk. Existing customer recipient remains unchanged.

## Backend status
Supabase function version 2 deployed successfully. Live partner QA submission returned `ok:true`; row `594c5d23-2dac-4f3f-9a9d-b584fd773c1d` was verified with source `website_partners` and type `have_accommodation`. This is clearly marked QA, not a genuine host. Email API accepted notification and confirmation requests; inbox delivery was not separately checked. Invalid javascript property URL rejected server-side.

## Browser checks
- New Partners page: 1440, 768, 390 and 320 pixel widths. Direct route and refresh, no horizontal overflow, empty/invalid forms, multiple URLs, submission failure preserving inputs, success state, correct payload, no JS exceptions. Screenshots inspected on desktop and mobile.
- Accommodation regression suite: 1440, 768, 390 pixels; quick enquiry, service paths, dates, review, mocked submission, follow-up, downloads, privacy, overflow and JS errors passed.
- Cleaning regression suite: 1440, 768, 390 pixels; service selection, pricing, mocked estimate/booking/checkout passed. No payment taken.
- Build and JavaScript syntax checks passed.

## Publication blocker
The source is committed locally on `pcco-partners`. Automatic approval review rejected the GitHub push as an unverified export of private code, requiring explicit approval. Website frontend has NOT been deployed, and production `/partners` QA remains pending. Backend routing IS live. After approval, push the branch, verify Vercel preview, merge/push main, and verify the production deployment and public route.
