# Host Solutions customer-initiated enquiries and Stripe event notifications

## What is deployed
- Consultation request: the existing four-stage review form tries GET /api/host-consultation and POST /api/host-consultation only after the visitor explicitly presses **Send my consultation request**. The backend validates consent, input size, origin, signed short-lived form cookie, a minimum form age and an empty honeypot. It sends one plain-text notification to the fixed PCCO business inbox through Resend and uses a unique provider idempotency key to reduce duplicate messages. No automatic email goes to the visitor.
- Fallback: if direct sending is disabled, invalid or cannot be verified, the page states that no submission is confirmed and offers a pre-filled mailto message. Never claim an enquiry was delivered without the provider's acceptance.
- Stripe notification endpoint: POST /api/host-stripe-notify validates Stripe's timestamped HMAC signature over raw bytes before processing. Only exact vetted PCCO Host Solutions Payment Link IDs and subscription product IDs qualify; unrelated PCCO Stripe cleaning events are ignored. Relevant event notices go only to the internal mailbox, with provider idempotency keys (valid 24 hours). Stripe Dashboard is the source of truth.
- Stripe event types to subscribe: checkout.session.completed, checkout.session.async_payment_succeeded, invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted. Webhook sends alerts only; no automatic refunds, service activation, marketing or customer email.

## Required secure environment variables, production target only
HOST_SOLUTIONS_ORIGIN=https://www.thepropertycareco.co.uk
HOST_SOLUTIONS_RESEND_KEY=<new restricted sending-only Resend credential for verified domain>
HOST_SOLUTIONS_EMAIL_FROM=PCCO Host Solutions <partners@thepropertycareco.co.uk>
HOST_SOLUTIONS_FORM_SIGNING_SECRET=<32 bytes of secure random data encoded as 64 hex characters>
HOST_SOLUTIONS_LEADS_ENABLED=approved
HOST_SOLUTIONS_STRIPE_NOTIFY_SECRET=<signing secret from new live Stripe webhook endpoint; starts whsec_>
HOST_SOLUTIONS_WEBHOOK_ENABLED=approved

Do not commit or expose keys; store only as sensitive Vercel production environment values. Configure the live Stripe webhook destination only after the production endpoint is deployed and verified. Verify the signature and dry-run tests, then test a controlled internal-only consultation delivery after user approves the email draft. A card/refund test requires explicit user authorisation; do not create a charge automatically.

## Operational limitations
- Because this Vercel connection cannot create a durable Blob/Redis store (permission denied), event-processing idempotency relies on Resend's 24h Idempotency-Key window and Stripe's event history. Stripe may retry events beyond 24h; a duplicate notification is possible. This is not a financial ledger or automatic reconciliation.
- The signed consultation cookie plus strict Origin, consent, minimum elapsed time and honeypot reduce spam; they are not a substitute for durable per-IP rate-limiting or human verification. Add Cloudflare Turnstile and shared durable throttle before running large-scale advertising. Resend sending key is scoped to the approved domain and only the internal mailbox is allowed in code.
- The existing /api/host-checkout, /api/host-payment-status and /api/host-stripe-webhook are legacy disabled prototype routes; active public Stripe-hosted Payment Links do not use them. Do not enable their legacy environment gates unless a separate full Stripe API key and Redis setup is created and tested.
- Stripe checkout payment success is not inferred from redirects. Check the payment status in Stripe Dashboard, and follow up with customers using human-reviewed drafts.

## Hobby deployment limit compatibility
The Vercel Hobby plan permits 12 serverless functions. Legacy disabled prototype endpoints were deleted: /api/host-checkout, /api/host-checkout-config, /api/host-payment-status, /api/host-stripe-webhook. Their Stripe-key/Redis workflow never had production credentials or a live web UI. The consultation form GET and POST now share one /api/host-consultation endpoint. /api/host-stripe-notify is the single new webhook route. Active checkout remains Stripe-hosted, with no dependency on the removed routes.
