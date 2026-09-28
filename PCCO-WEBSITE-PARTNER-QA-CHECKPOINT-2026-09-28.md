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

## Batch 2 — 2026-09-28 13:18 UTC
- Corrected 153 stale top-level acceptance flags (Fab 46, Ruth 24, Brookland 83). Each changed row retains timestamp/reason/previous value in data.qa_acceptance_flag_correction.
- Verification: 158 published remain; zero stale top-level flags; 153 audit markers present.
- Public collection confirms all 158 cards render. 13 cards use the explicit photography-on-request state. Five cards have UK-only location fallback.
- Source review: onboarding rejects invitations with null sent_at; current unsent Smarter Rent replacement cannot work. Public feed currently checks partner status, not full acceptance validity; hardening remains outstanding.
- Known spelling/formatting issues confirmed on live cards. 88 Clive free/paid remains ambiguous in host-derived data. Calliope parking/bed configuration and Ellis bedroom count have existing source-conflict notes; do not guess.
- Nested JSON partner_acceptance_status still stale on some accepted listings; review and sync safely.
- Next: fresh Smarter Rent invitation with documented activation for pre-send QA, external test, draft only; then source-backed display fixes and complete image/detail audit.

## Batch 3 — 2026-09-28 13:20 UTC
Fresh Smarter Rent invitation externally tested successfully; correct company/current Terms/controls; not accepted. Activated per user request with delivery_channel explicitly EMAIL-NOT-SENT. Gmail reply saved as draft only, to Adrian and CC lettings. No email sent. Previous unsent invitation superseded.

## Batch 4 — 2026-09-28 13:24 UTC
- Corrected and re-queried eight typo/format records: BRO-005/006/070/074; FAB-031/037/038/039. Slugs preserved; previous names/parking in row audit metadata.
- Nestays supplied postcode MK42 6FR in new partner email. Updated NST-001; verified live feed returns it.
- Found Nestays image cause: img1.wsimg.com missing from image proxy allowlist. Fix committed in 6b3f1d417c709f43026b2ece14bfe2340a97de8e with city fallback, bathrooms/description display, studio detail handling, amenity dedupe, unknown-parking filter and source-specific pricing notes.
- Deployed property feed v4, enforcing full valid acceptance rather than status alone. HTTP verification: 200, 158 properties; Nestays postcode correct. Frontend production build initiated; final browser/image verification pending.
- Synced 70 nested JSON acceptance metadata records (46 Fab +24 Ruth) with row audit history; independent verification pending.
- Data baseline across 158: 13 no cover/gallery; 115 missing bathrooms; 129 missing description; 69 missing sleeps; 71 missing bed configuration; 129 without monthly rate; 5 missing postcode before Nestays correction; 1 missing parking; 1 missing bedroom count. Missing values not invented.
- New actionable emails: Nestays postcode/images; Vellanor four rates supplied but address-to-listing mapping needs confirmation; HOMEHOSTS questions; D3 supplied five Airbnb links. Replies still to draft.
- Next: verify deployed Nestays gallery and all public pages/images, finish host-source recovery; save detailed report and Smarter Rent staging in batches. Emails sent remains ZERO.

## Batch 5 — final audit continuation
- Re-ran live database integrity checks after the Astra checkpoint.
- Publication gate remains clean: 158 live / 60 staged; zero live properties without a valid non-invalidated acceptance; zero duplicate or missing slugs detected in the acceptance/publication check.
- Found 83 Brookland live records whose top-level flags were already correct but nested JSON acceptance metadata was still absent/stale.
- Synced all 83 Brookland nested records to partner_acceptance_status=accepted and requires_partner_acceptance=false, retaining a per-row qa_nested_acceptance_correction audit marker with the prior values.
- Independent verification after write: zero live nested acceptance-status mismatches; zero live nested requires-partner-acceptance mismatches; 83 Brookland audit markers present.
- No partner email was sent.

## Batch 6 — Smarter Rent private staging
- Enumerated the portfolio URL supplied by Adrian across all five pages: 114 distinct properties.
- Privately staged all 114 in Supabase under partner_id=smarterrent with published=false, requires_partner_acceptance=true and nested partner_acceptance_status=pending.
- All 114 staged records have a partner-hosted Guesty cover image, bedrooms, bathrooms, postcode and the source website weekly reference rate.
- Source weekly rates are stored as reference data only; public monthly_rate_gbp remains unset and pricing_status=rfq_required so PCCO does not present the website rate as a fixed/guaranteed PCCO rate.
- Each record notes that current availability and best price must be confirmed with the Smarter Rent lettings team per genuine enquiry.
- Verified the public property-feed returns an empty result for a staged Smarter Rent slug before T&C acceptance. Publication gate therefore remains intact.
- No Smarter Rent email was sent; the approved-review draft remains unsent.

## Batch 7 — source-backed image and listing corrections
- Re-opened the Brookland source spreadsheet and inspected the actual hyperlink cells rather than treating display text as plain text.
- Recovered 20 Brookland Drive photos for BRO-052 (Leeds - 1 Victoria Ave) from the partner-supplied linked folder; saved a qa_photo_recovery marker.
- Recovered 20 Brookland Drive photos for BRO-059 (Leeds - 501 Yeadon), prioritising the supplied "501 YEADON LEEDS COVER.jpg" as cover; saved a qa_photo_recovery marker.
- Recovered exact public Brookland property galleries for BRO-007 (Church Road, Wickham Bishops) and BRO-073 (92 Watkin Lane) from the matching Brookland property pages. Added 20 and 50 images respectively and source-backed guest/bathroom facts.
- Normalised FabAccommodation FAB-032 parking category to paid because the partner source explicitly says "Fee on street parking"; removed the now-resolved ambiguity note.
- Recovered FAB-042 bed configuration from the partner sheet row where it had been entered into the Parking cell: 2 king rooms, 1 single room, 1 twin room linkable into a king. Parking remains omitted because the partner did not supply it.
- FAB-043 Ellis Court remains intentionally unresolved for bedroom count because the partner sheet says 4 bedrooms while its own bed/configuration description says one full bedroom plus an open-plan sleeping area. No guess was made.
- FAB-021 23 Charles Road still has no usable partner-supplied photo files: the linked Drive folder is empty. External web evidence confirms the property exists at the stated address but no third-party images were copied into PCCO.
- Remaining live zero-photo records are now nine: eight Brookland Buxted Inn room rows with no photo link supplied, plus FAB-021.
- No partner email was sent.
