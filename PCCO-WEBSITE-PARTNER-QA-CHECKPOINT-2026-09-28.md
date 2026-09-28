# PCCO WEBSITE & PARTNER QA CHECKPOINT – 28 SEP 2026

## Batch 1 — 2026-09-28 13:20 UTC
- Read live Supabase partner, invitation and acceptance records; audited all 218 property records for publication eligibility.
- 158 published, all 158 tied to valid current acceptance (2026-09-26-v1). Zero published without valid acceptance. 60 unpublished.
- Five accepted partners: FabAccommodation (46 live), Ruth Top Host (24), Nestays (1), Vellanor (4), Brookland Stays (83). Eleven pending partners.
- Validity checked: partner accepted status, matching partner and invitation, matching current terms version, checkbox, non-invalidated acceptance, non-revoked invitation, matching partner email, delivery before acceptance, acceptance before invitation expiry.
- 153 published records have stale requires_partner_acceptance=true. No corrections made yet; inspect backend semantics before changing.
- Smarter Rent: pending; zero properties staged or live. Prior invitation revoked; replacement invitation exists but is unsent. Do not accept Terms during testing.
- Email thread reviewed: malformed nested website link exists in quoted correspondence. Cause of all reported failures remains unverified.
- Public collection loaded in external browser; full listing rendering, image tests and detail QA remain outstanding.
- No emails drafted or sent in this audit. All email sends require Sandeep approval. Ceba accommodation correspondence remains on hold.
- No property data or acceptance records changed.

## Exact resume point
Inspect backend invitation delivery gating and property feed; persist detailed private partner audit separately; correct and verify stale acceptance flags. Test main public routes, then every published detail and image. Generate fresh Smarter Rent invitation, test externally without accepting, save Gmail draft only. Stage portfolio in batches with publication blocked pending acceptance, QA and Sandeep approval.

## Security
Private invitation tokens and partner email contents must never be committed to this public repository.
