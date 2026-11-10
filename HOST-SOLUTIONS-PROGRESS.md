# Progress
## 10 November 2026 — inspection and planning
- Cloned repository and reviewed current build, production entry, API inventory and complete consultation prototype.
- Prototype 950baab is 2 ahead/0 behind main bcd3ab9; created local feature/host-solutions-complete from prototype.
- Vercel project prj_32BDhNcZMrqs2JvLGZiAl5FdlFW8 / team_dQ4Q5IIRCbOwBlQxQYUlILTA; preview deployments protected by Vercel sign-in.
- Stripe exposes only PCCO live account. No Stripe credentials in Vercel (only existing OpenAI variable; value not read).
- No production configuration changed, messages sent or payments created.
- Current: save initial plan then implement isolated Host Solutions experience.
- Tests: not yet run. Preview: not yet deployed. PR: not yet opened.

## Milestone 2 — website experience
- Plan saved remotely at 21e47ab14b5d5e2bab883d4cbf2dba93d3bf3fe6. Shell push lacks credentials; GitHub connector tree/commit/ref workflow succeeded. Continue using connector for remote commits, then fetch to align local Git.
- Rebuilt Host Solutions in isolated HTML/CSS/ES modules with exact-pence catalogue and expiry logic, pricing cards, 22-row desktop/mobile comparison, all service sections, FAQs, safe scripted demonstration, four-step consultation with review/edit/confirmation and deposit review dialog.
- Full build and JS syntax check passed. Existing build mutates old HTML to add navigation; restored those generated source changes to avoid unrelated diffs.
- Local preview http://127.0.0.1:4173/host-solutions/ renders and exposes expected prices/sections in browser. Visual/interaction QA in progress.
- No requests sent by consultation/demo; no payment API calls. VAT/discount term/fair-use and other commercial approval gates remain explicit.

## Milestone 3 — protected integration foundations and QA
- Website milestone committed remotely at 94292712c7f18e2c6d4b1e4a4939d4963237ca5c.
- Added Stripe SDK, test-only deposit/status/webhook adapters, cookie-bound verification, Redis durable event recording/idempotency and origin/rate protections. These are deliberately closed by unapproved commercial flags and absent credentials.
- Added gated lead endpoint with bounded validation, consent/honeypot, rate limit, Turnstile verification and fixed-recipient notification. Frontend remains local simulation; no email was sent.
- Added integration instructions and draft Stripe catalogue. Subscriptions/portal/receipts lifecycle and real sandbox end-to-end remain outstanding; do not claim checkout works.
- 11 automated tests passed, 0 failed. Includes exact monetary values, boundary expiry, invalid package, live/prod rejection, approval gate, deposit vs subscription separation, paid-session rules, lead validation, origin/body, disabled endpoints and webhook signature tampering.
- Browser: desktop rendered; Direct Booking review totals correct; Escape closes modal; missing field blocked; all form steps/review/confirmation passed with fictional data; scripted contractor scenario passed. Mobile 390px frame (375px content) and tablet 768px inspected. Mobile comparison switches to Portfolio Pro and shows correct features. Mobile document width equals viewport, no horizontal page overflow. Native physical iOS/Safari not tested.
- Replaced unsupported diagonal-arrow glyphs; corrected unavailable-feature success colour; tightened phone validation.

## Milestone 4 — first deployed preview
- Integration milestone saved: 28b2c03d52ad56856695c9faf0e2bc93acffdf37.
- Draft PR: https://github.com/thepropertycarecouk-alt/-property-care-co-website/pull/16 (do not merge).
- Vercel READY staging/preview: https://pcc-live-site-260825-e3u0yf2x9-thepropertycarecouk-4795.vercel.app/host-solutions/ ; deployment dpl_9BhQL6CpJVp6dWRufuYFZmYZjRCo, source 28b2c03d52ad56856695c9faf0e2bc93acffdf37.
- Authenticated deployed-page checks: page, JS and confirmation route HTTP 200; checkout GET HTTP 405 with no-store/nosniff. Browser access requires existing Vercel login; deployment protection unchanged. Visual QA performed against identical local source.
- First API deployment attempt rejected target=preview (400); corrected to Vercel API target=staging and succeeded. No production deployment attempted.
- Found header route matcher did not cover directory pages on first deployment (JS had CSP but page did not). Changed matcher to /host-solutions(.*); must verify in next preview. Form/checkout remain disabled independently.
- Saved actual local pricing screenshot docs/host-solutions/pricing-preview.png. Reformatted source for maintainability.
