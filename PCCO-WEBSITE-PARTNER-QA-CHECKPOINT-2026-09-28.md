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

## Batch 8 — final operational completion pass
- Final acceptance/publication integrity query: 158 live, 183 staged, zero live without valid Terms, zero live nested acceptance mismatches, zero staged properties belonging to already-accepted partners, zero duplicate slugs.
- Live no-photo count is now 9: Brookland Buxted Inn rooms 1–8 plus FabAccommodation 23 Charles Road. These are explicit source gaps, not broken-image records.
- Public feed leakage test passed: D3, Stay Zen, Smarter Rent and Ceba staged slugs each returned [] while Nestays returned its live accepted record.
- Smarter Rent: 114 privately staged properties remain unpublished/T&C-gated. Existing unsent Gmail draft refreshed to state that all 114 are prepared privately and to ask Adrian to test the verified fresh Terms link.
- D3 Short Stay: 5 properties privately staged, unpublished and T&C-gated. Private invitation externally verified against D3 Short Stay and current Terms version. Unsent reply draft saved.
- Stay Zen Apartments / Queen Anne Cottage: 4 properties privately staged, unpublished and T&C-gated. Private invitation externally verified against the correct partner identity and current Terms version. Unsent reply draft saved.
- Added l.icdbcdn.com to the authorised image proxy host list for partner-supplied Lodgify images; production deployment is READY.
- Vellanor host-supplied 30-night rates mapped and stored as indicative only: Kirby Road £2,000; Shakleton Road £2,200; Coniston Road £3,200; Sky Garden/Manchester £2,700. Each row has qa_rate_mapping audit metadata.
- Ceba property intentionally placed on commercial_terms_hold. Standard Terms must NOT be issued because Abraham proposed 8% commission including VAT, which conflicts with the standard 7.85% + VAT Terms. Current £2,900 supplier context moved to source_monthly_rate_gbp and public monthly rate cleared. Property remains unpublished.
- Location search code confirmed to use a selected-place 15-mile radius automatically. No separate radius control is required. Current provider is UK postcode data + Photon/OpenStreetMap, not Google Places. No Google Places key/reference exists in the repository.
- Hardened location-suggest endpoint so Photon provider timeouts fall back cleanly instead of returning a production 503; production deployment READY.
- Unsent drafts saved for HOMEHOSTS commercial questions, LuxEdge onboarding, Brookland missing Buxted data/photos, and FabAccommodation remaining source gaps. No outbound partner email was sent in this pass.

## Batch 9 — final live production verification
- Final browser QA completed against production after the latest deployment.
- Public property count confirmed at 158.
- Recovered-image properties verified live with real cover images/galleries: BRO-007 Church Road, BRO-052 1 Victoria Ave, BRO-059 501 Yeadon, BRO-073 92 Watkin Lane.
- Intentional placeholders verified for FAB-021 23 Charles Road and Brookland Buxted Inn rooms 1–8; no broken-image icons were visible.
- Location autocomplete successfully returned a UK postcode suggestion and accepted the selection. The browse code confirms selected locations call /api/postcode-radius with radius=15 and sort/filter matching public properties by distance. The automated browser did not reliably expose the transient "within 15 miles" status text, but no location-search errors occurred after the timeout-hardening deployment.
- Final public-feed leakage test passed: staged D3, Stay Zen, Smarter Rent and Ceba slugs each returned empty results; accepted Nestays returned its live property.
- Production deployment for location timeout hardening is READY.
- No partner email was sent during completion.

## Batch 10 — emergency mobile image/detail-page repair
- User supplied an iPhone screenshot showing Brookland Brighton cards with broken images/alt text.
- Root cause 1: marketplace cards hotlinked static.wixstatic.com directly. The exact Flat 7 source returned HTTP 403 externally.
- Root cause 2: the PCCO proxy did not have robust Wix canonical/original fallbacks for malformed/transformed Wix URLs.
- Repaired api/property-image.js: Wix assets now try canonical/original candidates and are fetched server-side with browser-like request headers.
- Repaired marketplace cards: all cover photos now use PCCO /api/property-image rather than direct Wix hotlinks.
- Repaired property galleries: all gallery main/thumb images now use PCCO /api/property-image.
- Found and fixed a secondary detail-page bug caused by a stale trustedDirectPhoto() call after the helper was removed; this had caused valid properties to show a misleading “Property not found”.
- Added cache-busting query versions to property-browser.js and property-page.js so iPhone/Safari clients reload the repaired scripts.
- Production verification: exact Brighton B Block Flat 6/7 card images now use /api/property-image and render; Flat 7 detail page renders actual property data plus all 18 gallery images.
- Representative production image endpoints all returned HTTP 200 for Google Drive, Guesty, Airbnb, Nestays and Wix-backed properties.
- Verified Google Drive-backed 28 Borough Rd and Guesty-backed 1 Feathers Yard detail pages render correctly with visible proxy-served galleries.
- Full listing browser audit reported no broken images among properties with cover photos; intentional no-photo placeholders remain only for Buxted Inn rooms 1–8 and 23 Charles Road.
- No partner emails were sent during emergency repair.


## 2026-09-28 20:01 BST — partner form persistence fix

- Root cause confirmed: `pcc-accommodation` saved website partner submissions to `accommodation_enquiries` and emailed `partners@thepropertycareco.co.uk`, but did not create a `pcco_property_partners` record.
- Fixed in GitHub commit `9bd4f7c4dc33786332575408834d9b55363e4743`.
- Deployed Supabase Edge Function `pcc-accommodation` version 10.
- New website partner submissions now create/reuse a pending `pcco_property_partners` row before the enquiry is accepted, while property publication and T&C acceptance remain manual.
- Backfilled genuine missed website forms:
  - Borderless Properties Ltd / Sacha Mahoor / mahoor9999@gmail.com
  - Sublime Stays LTD / info@sublime-stays.com
- Deliberate QA form submissions remain excluded from the partner table.
- Added pending tracking records for direct positive supplier conversations that did not originate from the website form:
  - JG STAYS LTD / Cynthia Ebere
  - HOMEHOSTS Management Ltd
  - LuxEdge Real Estate
  - Bucklehole / Ariyan Gill
- Created private pending T&C invitations for Borderless Properties Ltd and Sublime Stays LTD. They are NOT marked as emailed yet and no partner email was sent.


## 2026-09-28 evening — property data / image / postcode integrity pass

Completed a source-backed integrity pass across live and staged PCCO Stays inventory.

### System fixes
- Repaired `api/property-image.js` allowlist for verified partner/source image hosts:
  - `bookingenginecdn.hostaway.com`
  - `www.comfyworkers.com`
  - `cf.bstatic.com`
  - `londonexecapartments.com`
  - `images.squarespace-cdn.com`
- Existing approved hosts remain supported.
- Automatically repaired missing `cover_photo` objects across properties that already had valid photo arrays by using the first stored photo.
- No property with photos now lacks a cover image.

### New/missed partner staging
- Borderless Properties: BOR-001 privately staged from supplied ComfyWorkers + Booking sources. SW18 retained because full postcode is not publicly verified. 5 bedrooms / 3 bathrooms / sleeps 5. Source gallery visually verified.
- Sublime Stays: SUB-578298 privately staged from supplied direct Hostaway listing. Stratford, East London retained; exact postcode left blank because source does not expose it. 1 bedroom / 1 bathroom / sleeps 4. Source gallery visually verified.
- Both remain unpublished and the public feed was tested to return [] while Partner Terms are pending.

### Live listing repair
- FAB-021 23 Charles Road corrected from source-backed Booking.com data:
  - postcode BS34 7ES
  - 4 bedrooms
  - 2 bathrooms
  - sleeps 7
  - verified parking wording
  - 8 property photos + cover
- Actual PCCO live page visually QA-tested: location, facts, parking, enquiry form, main image and all 8 thumbnails passed.

### Vellanor
- Filled previously missing live postcodes from verified sources:
  - VEL-001 M15 4UU
  - VEL-002 CV5 6HT
  - VEL-003 CV5 (outward only; exact full postcode not exposed)
  - VEL-004 CV5 6HL
- Result: no published property now has a blank postcode.

### London Executive Apartments
All 13 pending listings now have direct-source photography and location data:
- LEX-001 HA9 0NR
- LEX-002 HA9 0FT
- LEX-003 HA9 0QG
- LEX-004 HA1 1AR
- LEX-005 HA1 3NH
- LEX-006 WD17 1DS
- LEX-007 WD17 1AP
- LEX-008 HA4 8PQ
- LEX-009 HA4 8QH
- LEX-010 NW9 4EN
- LEX-011 NW9 only because partner source covers multiple Colindale addresses/postcodes
- LEX-012 HA7 1FD
- LEX-013 UB9 4BS
Mixed-unit pages remain mixed rather than forcing a single bedroom count.

### Other pending partner repairs
- SRK-001..004: direct-source images added; bed configuration and secure gated parking verified.
- LAN-001 Crystal Unit: 8 direct Squarespace property images added from a 39-image direct gallery.
- STK-008 Railway Terrace: 5 property-specific Airbnb images recovered using alternate Airbnb rendering.
- STK-009 Maplin Park: 5 property-specific Airbnb images added.
- Allsquare ALL-001..005: direct Hostaway/Booking sources mapped; property-specific photos and verified facts added. Locations improved to Hayes/Harlington UB3 5BJ; London Bridge/Southwark SE1; Staines TW18 1PE; Teddington TW11 8UD; New Bedfont/Feltham (exact postcode not publicly confirmed).
- ROSE-002: property-specific Airbnb images recovered.
- CEB-001: property-specific Airbnb images recovered, but listing remains unpublished/commercial hold.

### Final structural audit after repairs
- 343 total properties
- 158 published
- 185 staged/unpublished
- published missing postcode: 0
- published generic UK/England/Greater London location: 0
- staged properties with zero photos: 0
- properties with photo arrays but missing cover: 0
- published properties belonging to pending/unaccepted partners: 0
- 8 published zero-photo records remain: Brookland Buxted Inn rooms 1–8. These intentionally use the site's "photography available on request" fallback because room-specific photography was not supplied.
- Remaining blank bathroom/sleeps fields are primarily host-source omissions in Brookland/FabAccommodation. The UI filters missing facts and does not display fabricated zeros/undefined values; these are intentionally not guessed.


## 2026-09-28 21:45 BST — Ceba removed from partner network
- Per Sandeep instruction, Ceba Property Ltd has been removed from the PCCO Stays onboarding/property system.
- Deleted staged property record(s) for partner id `ceba-property`.
- Deleted any partner invitation / acceptance records for Ceba.
- Deleted the `pcco_property_partners` row.
- Verification after deletion: 0 Ceba properties, 0 invitations, 0 acceptances, 0 partner records remain.
- Historical Gmail correspondence was not deleted.
