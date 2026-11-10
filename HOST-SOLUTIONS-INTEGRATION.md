# Integration and release gates
## Current state
No production settings changed. Live-only Stripe connector was inspected read-only; no products created. Test endpoints are implemented but **not activated or end-to-end Stripe verified**. Frontend intentionally has no network submission/payment action. Its deposit modal is a review, not a working Checkout Session. The demo is scripted, not live AI.

## Test Stripe setup (next session)
1. Obtain owner-authorised PCCO Stripe sandbox/restricted TEST key; store as branch-scoped sensitive Vercel variable HOST_SOLUTIONS_STRIPE_TEST_KEY. Never commit its value. Production environment and live keys are unconditionally rejected by this code.
2. Approve VAT and final payable totals, monthly offer duration, payment schedule/refund policy and AI fair-use terms; update catalogue launchTerms only with recorded owner approval. Current terms flags are all false.
3. Provision isolated durable Redis REST storage for test state and rate limits. Variables HOST_SOLUTIONS_REDIS_URL / HOST_SOLUTIONS_REDIS_TOKEN. No in-process payment storage. Add retention policy for payment records before real launch.
4. Set HOST_SOLUTIONS_ORIGIN to exact HTTPS preview origin. Configure HOST_SOLUTIONS_PAYMENT_METHOD_CONFIG to a verified sandbox payment-method configuration excluding ALL finance/BNPL methods (including Klarna/Clearpay). Do not silently inherit account defaults.
5. Register test snapshot webhook /api/host-stripe-webhook and sensitive HOST_SOLUTIONS_STRIPE_WEBHOOK_SECRET. Events: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed. Signature verified from raw body, test events only, successful paid deposit recorded atomically SET NX. Failures separately recorded; no automatic build/email. Prove retry/idempotency with real sandbox deliveries.
6. Set HOST_SOLUTIONS_CHECKOUT_ENABLED=test-approved in preview only after above. Wire the currently disabled frontend button to POST /api/host-checkout, with package and explicit agreement. Endpoint uses server prices; creates £99 payment only, not subscription. Verify VAT-inclusive/exclusive final amount before altering the deposit's tax behaviour.
7. Success page /host-solutions/confirmation/ verifies via /api/host-payment-status and HttpOnly token/session binding. Query session_id alone cannot grant confirmation. Verify complete, declined, cancelled and delayed payment paths.
8. Prepare Stripe products/prices from HOST-SOLUTIONS-STRIPE-CATALOG.json. Monthly maintenance and AI require separate approved subscription sessions after scope/start date agreed. **Recurring checkout, customer portal authentication, invoices/receipts, failed subscription payments, refunds/disputes and cancellation webhook lifecycle are still to implement and test.** Do not activate real charging until complete.

## Lead delivery setup (next session)
/api/host-consultation is gated by HOST_SOLUTIONS_LEADS_ENABLED=approved. It validates bounded fields/consent/URLs/phone and honeypot; requires exact origin, Redis rate limiting and a Turnstile token with correct hostname/action. It sends a plain-text notification ONLY to partners@thepropertycareco.co.uk using Resend, never arbitrary recipients. Sensitive variables: HOST_SOLUTIONS_TURNSTILE_SECRET, HOST_SOLUTIONS_RESEND_KEY; configuration HOST_SOLUTIONS_EMAIL_FROM (verified domain sender), HOST_SOLUTIONS_ORIGIN. No emails sent during this session.
Before activation: approve privacy notice/data retention/contact processing; add visible Turnstile widget with action host-consultation and update route-specific CSP for its script/frame/connect origins; change frontend confirmation to await actual API success and handle failure/retry. Use a sandbox mailbox/mock for tests, not business/customer recipients. Current local review and confirmation is clearly labelled preview only.

## Release review
- Retain main branch / production domain unchanged until explicit approval.
- Review implementation, VAT, offer duration, revision/cancellation/refund terms, final-payment schedule, AI conversation cap and content/support allowance.
- Test real integrations in sandbox; verify user consent and no finance methods.
- Remove preview notices/noindex only with launch approval, update canonical/metadata/sitemap and main navigation at that time.
- Regression-check Stays enquiries, inventory, assistant, cleaning, partners, landlords, property and location SEO routes. Their source is unchanged apart from inherited feature-branch navigation.

## Branch QA automation added during continuation
A GitHub Actions workflow under .github/workflows/host-solutions-preview-qa.yml checks pull requests into main for changes under Host Solutions. It installs dependencies with scripts disabled, validates JavaScript syntax, runs the Node test suite and builds the site. It uses no application secrets, payment tokens or live deployment operations. Consult PR checks to verify run outcome; the existence of a workflow does not prove tests passed.

## New owner-approved tax display
All quoted website build totals, monthly maintenance rates and the £99 deposit are VAT-inclusive. Do not add VAT on top. The 25% opening discount lasts until 31 December 2026 inclusive. Standalone AI VAT not yet confirmed. Stripe Tax remains pending/head-office missing, no registrations — never treat customer-facing VAT inclusion as proof of Stripe Tax compliance.

## Stripe live/preview gates (code prepared, no credentials configured)
- Set HOST_SOLUTIONS_STRIPE_TEST_KEY only on preview and HOST_SOLUTIONS_STRIPE_LIVE_KEY only in production. Production key must be secret or restricted server-side, not in HTML or source.
- Backend requires HOST_SOLUTIONS_TAX_READY=verified, HOST_SOLUTIONS_STRIPE_TAX_CODE (approve website design code), HOST_SOLUTIONS_STRIPE_WEBHOOK_SECRET, HOST_SOLUTIONS_REDIS_URL/TOKEN, HOST_SOLUTIONS_PAYMENT_METHOD_CONFIG excluding BNPL, and HOST_SOLUTIONS_ORIGIN (exact HTTPS site origin). Use HOST_SOLUTIONS_CHECKOUT_ENABLED=test-approved for test previews, then live-approved on production only after E2E and legal/commercial approval. No env keys currently installed.
- Price_data.tax_behavior=inclusive and automatic_tax.enabled=true, so Stripe Tax must be fully configured, registered and tested. The £99 deposit is a one-time payment only; no maintenance or AI subscriptions are activated.

## Verified code/preview and Stripe account blocker
CI run 42874592607 passed all 13 tests, JS syntax and build from source SHA 585b07e60479ba4d71927f4e75497e112276e559. Latest ready preview (application) is https://pcc-live-site-260825-it53a22d4-thepropertycarecouk-4795.vercel.app/host-solutions/. GET /api/host-checkout-config returns enabled:false by design. Merchant has no active Stripe Tax registration, head office is missing and Vercel has no Stripe/Redis secrets. Do not switch live before completing those requirements and recording approved written terms.
