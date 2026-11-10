# November 2026 final audit — secure, durable form rate limiting
Host Solutions uses an isolated Supabase private schema with single-use signed form challenges, per-IP quotas and 48-hour cleanup. Existing PCCO production data/tables were not modified. Vercel production credentials are sensitive. The website offers a manual email fallback if the limiter is unreachable. The assistant did not send an external test email or payment transaction without customer approval.

# 10 Nov 2026 — Production email and Stripe alert credentials
Resend sending-only domain-restricted credential and signed form secret are saved in Vercel production env (not source). Production GET /api/host-consultation reports {enabled:true} and the updated form is live. An independent Stripe webhook endpoint we_1UaMWsAuxFu0m9QL3hGECPcb is created disabled and its signing secret is in Vercel production env; deploy latest build before enabling webhook. See docs/host-solutions/lead-and-payment-notifications.md. Do NOT modify the existing unrelated cleaning payments Supabase webhook. This commit and CI trigger production redeployment to pick up the final webhook secrets.

# Live form and Stripe notification improvement — 10 November 2026
A new cookie-verified serverless form adapter and signed Stripe event notification endpoint are developed. See docs/host-solutions/lead-and-payment-notifications.md. The frontend attempts direct submission only if the backend reports ready; otherwise provides a truthful email fallback. Payment events are restricted to vetted Stripe IDs and result only in internal alerts; no automatic customer email, refunds or subscriptions. Production environment variables and account permissions determine whether features can be activated. Read actual deployment/CI status before claiming any integration is live.

# PCCO Host Solutions — current operational handoff
Updated 10 November 2026. Production is LIVE at https://www.thepropertycareco.co.uk/host-solutions/. GitHub main has been released through PR #16, #17 and #18. The primary operational guide is docs/host-solutions/stripe-billing-operations.md, followed by the historical notes below.

## Current verified state (supersedes older preview notes)
- The three website £99 one-time Stripe deposit links are live and working through Stripe-hosted checkout. A separate standalone AI £150 one-time setup link is now customer-facing after checkbox agreement. Separate monthly subscription links for AI and the three website maintenance tiers are prepared and live in Stripe but are only offered after client-specific scope and activation agreement.
- New standalone Host Solutions Stripe customer billing portal has login, invoices, card update and cancellation at paid-period end. Existing PCCO cleaning-plan portal was not changed.
- 25% website build promotion ends 31 Dec 2026. The website dynamically selects the right three **standard** £99 deposit Stripe links after the offer, keeping standard totals and balances accurate. 2026 promotional links must still be manually disabled after the deadline.
- Discount £5 for six maintenance months: Stripe coupon R0MnZOnN and public code PCCO6 expire 31 Dec. A private grandfathering coupon 7mhUyUIW exists for 2026 customers whose service starts later. All subscriptions require customer opt-in; coupon application must be verified at Stripe Checkout.
- Separate links for remaining 2026 build balances (£200.25/£388.50/£647.25) are stored in Stripe, not published directly on the website.
- Stripe live API keys, webhooks and Redis are NOT configured in Vercel; Stripe-hosted links work independently of those. Web-form consultation opens the visitor's email app; it is NOT auto delivered. No live card test payment/refund has been run and no automated provisioning exists. Claims of 100% end-to-end verified payment are NOT justified.
- Website/customer pages must not use the phrase the owner asked to remove; keep final-price messaging and no unwanted extra charge disclosure. Existing partner and website routes are unchanged.
- For exact latest main SHA, read GitHub main after merging this branch. Code and price catalogue are saved in GitHub, not just chat.

## Historical project handoff
Updated 10 November 2026. This is an implementation preview, NOT payment/lead-launch ready.

## Repository and review
- Repository: https://github.com/thepropertycarecouk-alt/-property-care-co-website
- Branch: feature/host-solutions-complete
- Draft PR: https://github.com/thepropertycarecouk-alt/-property-care-co-website/pull/16
- Latest deployed application SHA: 585b07e60479ba4d71927f4e75497e112276e559
- Latest handoff commit: use the GitHub branch head / git log -1 (this document cannot contain its own hash).
- Working Vercel preview: https://pcc-live-site-260825-it53a22d4-thepropertycarecouk-4795.vercel.app/host-solutions/
- Deployment: dpl_3x5Grmh6VPTn1sy36TPfUvP1HZp2, READY, target staging (Vercel API name for this non-production deployment).
- Vercel project pcc-live-site-260825 / prj_32BDhNcZMrqs2JvLGZiAl5FdlFW8, team team_dQ4Q5IIRCbOwBlQxQYUlILTA.
- Vercel authentication remains enabled. Owner must sign in to view; no protection disabled. Authenticated connector verified deployed page HTTP 200 and CSP, noindex/nofollow, nosniff and referrer policy.

## Completed
Premium navy/gold/cream page; free mockup offer; all three correct promotional price cards and £99 balances; responsive feature comparison with explanations; standalone AI and opt-in trial terms; scripted cost-free assistant demo; supporting optimisation services; co-hosting Talk to Us only; process; verified PCCO example; FAQs/contact; four-step brief validation/review/edit/preview confirmation; deposit review dialog; verified-payment confirmation page; test-only Stripe and secure lead adapter foundations; draft Stripe product catalogue; scoped security headers and regression isolation.
All work saved in remote commits, not merely the conversation. Screenshot: docs/host-solutions/pricing-preview.png.

## Safeguards / blocking configuration
Do NOT merge main, promote deployment, change production domain, enable real payments or send any development/customer emails. Main source at inspection bcd3ab9; inherited prototype navigation appears only on this branch. Existing AI/enquiry/cleaning/landlord/partner APIs were not edited.
Only live PCCO Stripe account exposed; NO test credentials available and no Stripe products created. Existing Vercel OpenAI key value was not read. No new environment variables set. Payment endpoint rejects live keys and production environment; commercial flags all false. Frontend remains local preview, sends no submissions. Never describe the deposit modal as successful Stripe checkout.

## Tests and limits
- npm run build passed; Vercel READY confirms deployed build.
- node --test tests/host-solutions.test.mjs: 11 passed / 0 failed.
- JS syntax passed. Money, expiry, invalid package, live/prod rejection, approval gates, no surprise subscription, validation, origins, request size and webhook tampering covered.
- Browser desktop layout, prices/deposit breakdown, Escape modal close, required-field error, complete brief/review/confirmation and scripted contractor chat passed.
- 390px mobile frame (375px content) and 768px tablet inspected; mobile comparison selector works, page scrollWidth equals viewport. Not physical iOS/Safari testing or a comprehensive accessibility audit.
- Deployed page/assets/confirmation HTTP 200. Checkout GET 405. Security headers initially missing on directory pages, FIXED and verified on final preview.
- Shell Git push failed for missing credentials; connector commits succeeded. First Vercel API call target=preview rejected; target=staging succeeded. Neither is an unresolved failure.
- Real Stripe sandbox E2E, email delivery, subscription lifecycle and full production functional regression have NOT been run.

## Decisions awaiting owner
VAT treatment; lifetime versus defined term for £5/month discount; deposit/final-payment timing and refund/cancellation policy; AI conversation allowance/overage policy; content maintenance allowance/support terms; design revisions/ownership handover terms; lead privacy/retention; final preview approval; separate explicit production/live-payment approval.

## Exact next-session steps
1. Fetch/check out feature/host-solutions-complete. Read PLAN, PROGRESS and INTEGRATION files. Inspect branch diff before changes; do not overwrite unrelated work.
2. Review preview with owner; record actual commercial decisions. Do not silently fill missing terms.
3. Follow HOST-SOLUTIONS-INTEGRATION.md: branch-scoped Stripe sandbox restricted key, isolated Redis REST storage, exact origin, card/non-finance payment configuration and signed webhook. Never use live connector to create test products.
4. Implement separately authorised maintenance/AI subscriptions, authenticated billing portal and invoice/failed-payment/refund/cancellation lifecycle. Wire frontend checkout only after approved terms/config and verify sandbox end-to-end, including retries/declines/cancellation.
5. Configure approved lead delivery/Turnstile/privacy; wire frontend to actual success response. Tests must use mocks/sandbox mailbox without sending to partners/customers.
6. Run node tests/build, responsive/keyboard checks and regression of existing flows. Deploy staging preview; preserve protection; update documents and draft PR with SHA/URL.
7. Only after explicit finished-preview approval consider merge/production launch; live charging requires separate explicit approval. Remove preview/noindex and add canonical/sitemap metadata only as part of approved launch.

## Commit mechanics in this environment
Git clone/fetch works; shell push has no credential. Use GitHub create_tree with current tree, create_commit with branch head, then update_ref with expected_sha. Verify success before claiming saved. Fetch remote and align local with git add + git reset --soft FETCH_HEAD only after verifying same contents. Never force overwrite.

## 10 November continuation — new review milestone
- Latest previous verified branch head before edit: 7499126f9bd891fe0709fdcbb90f2673902c4e55. Fetch current branch/PR #16 for this milestone's exact SHA.
- Added a detailed Direct Booking vs Portfolio Pro benefits guide at #package-guide; standalone AI purchase preview dialog; and green £5 monthly-saving messages. No integration was unlocked.
- Added an automated source-safety test in tests/host-solutions.test.mjs. Run `node --test tests/host-solutions.test.mjs` once a Node environment with dependencies is available; do not assert it passed without running it.
- New preview URL and deployment verification must be recorded after deployment. Earlier READY preview URL remains above until then. Do not merge or enable transactions.

## Preview QA status following 10 November continuation
- Latest deployment source bdef3853f4b900f2d950ea432e0ead7bef0237ac, READY, target staging: https://pcc-live-site-260825-it53a22d4-thepropertycarecouk-4795.vercel.app/host-solutions/ (dpl_3x5Grmh6VPTn1sy36TPfUvP1HZp2).
- Authenticated Vercel fetch confirmed /host-solutions/, app.js, styles.css and confirmation page HTTP 200. The route has CSP, X-Robots-Tag noindex/nofollow and X-Content-Type-Options nosniff. Checkout GET returned 405, as expected. JavaScript syntax parsing passed (module import excluded; no application code executed).
- Added a PR-only GitHub Actions QA workflow to run npm ci, node --check, the automated tests and npm run build without secrets. Its passing status is **not verified** yet: check GitHub Actions/PR checks before claiming tests passed.
- No browser interaction or physical-device QA of this newest visual change has been completed. Previous browser QA and the existing 11 tests belong to the earlier milestone. Recheck new desktop/mobile package guide and AI modal before release.
- The connected sandbox does not support cloning this repository directly; connected GitHub write APIs were used. Branch ref moved with a non-forced fast-forward check.
- Resume: inspect the latest PR head, run/inspect CI, visually review the new package guide and AI review modal on mobile, then address missing Stripe TEST, approved commercial terms, form privacy/delivery, subscriptions and cancellation lifecycle. Keep production untouched.

- CI runner setup incident: run 42868934910 failed before executing code because the initial checkout pin was mistyped. Repaired the pin in a follow-up commit; inspect the next workflow run's steps and logs. No production impact.

## Final verified check — 10 November 2026
- Branch application/CI ref: 760968588758699d320a346cf6b08c9e0bfa748c. Documentation-only commit follows; to obtain exact current SHA read draft PR #16 head.
- GitHub Actions run 42869096698: SUCCESS, 12 automated tests passed, 0 failed; npm ci, browser JS syntax check and npm run build all passed. https://github.com/thepropertycarecouk-alt/-property-care-co-website/actions/runs/42869096698
- Latest verified preview for this ref: https://pcc-live-site-260825-it53a22d4-thepropertycarecouk-4795.vercel.app/host-solutions/ (dpl_3x5Grmh6VPTn1sy36TPfUvP1HZp2, READY, non-production).
- Authenticated Vercel responses: main Host Solutions page, app.js and catalogue all HTTP 200; route contains expected package guide and AI purchase dialog and remains noindex. Consultation GET returns 405 and delivery remains disabled.
- Remaining critical blockers: owner approvals listed above, TEST Stripe/Redis/Webhook environment configuration, subscription/payment lifecycle, production-quality lead delivery, real sandbox E2E and physical mobile/keyboard browser checks. Keep both payments and real lead submissions closed until explicit approval and verification.
- Next chat: read the entire PLAN, PROGRESS, HANDOFF and INTEGRATION; retrieve current draft PR #16 head and latest deployment, confirm no newer work, then advance only the unfinished gates on the branch. Never merge into main without explicit user approval.

## 10 November 2026 — user VAT and offer confirmation
- Owner confirms website builds, £99 deposit and monthly maintenance amounts are VAT-INCLUSIVE; no tax added to displayed website prices. The 25% one-off build offer expires 31 December 2026. Price arithmetic has not changed.
- Connected Stripe account is The Property Care Co. live account (acct_1U1mpNAuxFu0m9QL). Its Stripe Tax settings are pending (missing head_office) with no tax registrations. Only OPENAI_API_KEY present in Vercel env; Stripe payment keys not installed. Production payments are blocked while setup and monthly discount duration, deposit refund/balance policy and fair-use terms await approval.
- Do not merge, publish or charge until safe payment and email paths have been verified. Continue from latest PR head; no Stripe products or payment links exist at inspection.

## 10 November continuation — Stripe integration hardening
- Separated test and live Stripe keys by deployment environment; production never uses TEST key, previews never use LIVE key. Checkout remains gated behind explicit live-approved flag, fully approved commercial terms, Stripe Tax verified, website tax code, webhook, Redis, payment method configuration and exact origin.
- Server-side fixed £99 VAT-inclusive Stripe checkout session with automatic_tax and inclusive tax behavior, validated webhook, secure session-bound status, and no automatically created subscriptions. Added GET /api/host-checkout-config for safe public availability state (no sensitive credentials).
- No keys or environment variables configured; no payment possible by default. No Stripe product/link created. Checkout activation still awaits UK VAT registration confirmation and Stripe Tax setup, monthly discount duration, deposit refund and schedule policy, AI fair-use limits, and sandbox verification.

## Deposit UI integrated behind readiness gate
- On clicking a website package, the modal obtains public checkout readiness. Only when backend is enabled can the visitor agree to £99 VAT-inclusive deposit terms and open Stripe-hosted Checkout. A verified Stripe URL and server-side price protect the handoff; no recurring subscription begins automatically.
- No live payment setting enabled or production deployment performed. Stripe Tax and Stripe secrets are still missing, and refund/payment/monthly terms are not approved. This remains a private preview until launch-ready.

## Latest independently verified run (post VAT and Stripe code)
- 10 November 2026 commit 585b07e60479ba4d71927f4e75497e112276e559: GitHub Actions run 42874592607 SUCCESS; 13 automated tests passed, none failed; syntax and build passed.
- Vercel preview dpl_49CWYuJFFoSVkTqebn4udgp5vg2s READY: https://pcc-live-site-260825-it53a22d4-thepropertycarecouk-4795.vercel.app/host-solutions/ . Authenticated GET /host-solutions/, app.js, catalog.js and confirmation 200; /api/host-checkout-config returns {enabled:false,depositPence:9900,vatIncluded:true}; GET /api/host-checkout 405. Security headers/noindex preserved.
- No live purchase, subscription, Stripe product/link, or tax registration was created. Production remains main. Code is strictly closed until user-provided verified tax settings, commercial terms and secure server environment configuration.
- Documentation-only commit after this entry must be looked up from live branch HEAD for exact SHA.

## 10 Nov — owner VAT correction and live Stripe deposit links
- Owner explicitly says PCCO NOT UK VAT-registered; registered office 14 Vicarage Road, Stourbridge, DY8 4JE, UK. All website and AI prices are all-in, with NO VAT charged; remove prior misleading VAT-inclusive wording. Maintenance £5 opening discount applies for six paid months, then standard rates resume. £99 deposit refundable in full on request within 14 calendar days.
- AI fair-use proposed: 1000 monthly text replies standalone, 500 optional Direct, 500 included Portfolio, 50 trial; no surprise overage. AI is not yet activated, demonstration only.
- LIVE Stripe account charges/payouts enabled. 3 verified LIVE active card-only £99 Payment Links with automatic_tax false, email/phone/business capture and Stripe hosted success. Starter plink_1UaJtCAuxFu0m9QL1E6Bp2BH, Direct plink_1UaJtYAuxFu0m9QLQKxPgNxk, Portfolio plink_1UaJtbAuxFu0m9QLrj7gCtMu. URLs and all Stripe IDs in HOST-SOLUTIONS-STRIPE-CATALOG.json. No automatic subscriptions or Vercel credentials required; prior unused API remains closed. NO test charges made.
- Website links via deposit-links.js, agreement checkbox and public terms page; consultation creates a mailto draft that user MUST send in their own email app. Avoid claiming automatic lead submission. Promotion links should be deactivated/updated after expiry 31 Dec 2026; frontend prevents click after deadline, but copied Stripe link can still be accessed directly. Monitor.
- User explicitly authorised going live. Run current CI, preview, merge main and verify live domain before claiming public launch.
