# PCCO Host Solutions — Stripe live payment and billing runbook
Updated 10 November 2026.

## Connected account and checked products
Connected UK Stripe merchant: The Property Care Co. (account acct_1U1mpNAuxFu0m9QL).
Existing £99 Starter, Direct Booking and Portfolio Pro deposit links remain active and unchanged. Each is a one-time card payment. 14-day deposit refund policy and remaining balance by package are on /host-solutions/terms/.

New product IDs and price IDs are saved in HOST-SOLUTIONS-STRIPE-CATALOG.json. Public standalone AI one-time setup link is in public/host-solutions/stripe-links.js, and public access requires a customer-facing acknowledgement of a separate monthly subscription.

**Important:** Creating prices and payment links did not create any customer charge or subscription. No live card transaction or automated fulfilment has been tested.

## Starting an AI subscription — separate customer opt-in
1. Confirm the client's scope and delivery/activation date. One-time setup (£150 standalone or £75 Direct add-on) is processed separately; paying setup does not start monthly billing.
2. Find the corresponding monthly Stripe Payment Link by ID in HOST-SOLUTIONS-STRIPE-CATALOG.json (Stripe Dashboard > Payment Links). Standalone AI monthly £20, Direct Booking AI add-on £10.
3. Only when the client approves activation, send them that Stripe-hosted monthly subscription link, explaining monthly cost and when it begins. They start billing when they complete Stripe checkout. Do not automatically submit or email a payment link without user approval.
4. Inspect the resulting subscription and receipt in Stripe; agree support scope and 500/1,000 reply fair-use limits. No extra usage charges without explicit agreement.

## Starting website maintenance with the six-month opening discount
1. Confirm website is ready, customer wishes to begin optional maintenance, and eligibility under the 2026 opening offer.
2. Choose the correct *standard* monthly Stripe Payment Link from the catalogue: Starter £19/month, Direct Booking £39/month, Portfolio Pro £55/month.
3. Stripe coupon **R0MnZOnN** is £5 off in GBP for 6 months, limited to these 3 maintenance products. Promotion code **PCCO6** (promo_1UaLXrAuxFu0m9QL4M5zavWF) expires 31 December 2026 at 23:59:59 GMT. Recurring links have promotion-code entry enabled.
4. For eligible new clients, share the correct link with `?prefilled_promo_code=PCCO6` and explicitly verify the Stripe checkout shows the discounted first payment (£14 / £34 / £50). If it does not, stop and resolve with Stripe before the customer pays. Do not merely claim the discount was applied. Stripe's repeating-months coupon is six calendar months from redemption; if the subscription pauses or invoices are skipped, review this against the agreed six *paid* months and adjust manually as needed.
5. The standard rate then becomes due (£19 / £39 / £55 per month); no extra purchase is required. All subscriptions are opt-in and client-initiated by completing Checkout. Do not send these links to customers until scope/service activation has been agreed.

## Customer self-service billing
Separate Host Solutions Stripe billing portal configuration: bpc_1UaLYhAuxFu0m9QLLzbH2kpf. Public login URL in public/host-solutions/stripe-links.js. Portal is separate from PCCO's existing cleaning-plan portal, is **not** the merchant's default, and supports invoice history, updating card/details and cancelling subscriptions at the paid period's end. No customer IDs are published.

## Refunds, payment success, and receipts
- Verify deposit and setup payments in Stripe Dashboard; a client arriving at a return URL is not proof of payment.
- Refund requests and cancellation should be handled using Stripe's underlying payment, and the customer should be emailed a human-reviewed reply. Website deposit refund requests within 14 calendar days receive £99 back under published terms. AI setup cancellation/refund requests require the agreed scope and applicable statutory rights, not an invented universal guarantee.
- Stripe-hosted confirmation pages explain next steps; card processing is performed on Stripe-hosted pages. Never ask a customer for card details in email/WhatsApp.
- Client billing portal can cancel at period end. Do not assume Stripe portal automatically disables or removes the deployed AI service; operational deprovisioning remains manual.

## Known launch-operation gaps
- Vercel currently has only OPENAI_API_KEY and no configured Stripe webhook secret, restricted API key, isolated Redis/Resend/Turnstile credentials. Therefore private backend session verification, automated payment/event reconciliation, direct lead form delivery and subscription service provisioning are **not** active. Live Payment Links do work without Vercel secrets, but the fuller API-driven lifecycle cannot be claimed complete.
- The consultation form currently prepares an email in the visitor's own email app. It must not be represented as an automatically delivered enquiry.
- The new standalone AI setup link is customer-visible; the optional Direct AI and recurring links are created but intentionally withheld until separate client authorization.
- 25% opening website-build promotion ends 31 December 2026, and checkout CTAs hide promo pricing in January. Existing £99 deposit Stripe links must be deactivated or replaced after the offer; Stripe Payment Links do **not** automatically expire based on this website's timer. Owner action/automation required. Never let a customer pay an expired package without reviewing price.
- Test a low-value payment/refund end-to-end using an appropriate test account before asserting live payments' full lifecycle is proven. Do not create a real customer or initiate an actual card charge as a test without explicit authorization.
