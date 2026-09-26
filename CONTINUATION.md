# PCCO marketplace continuation — 26 Sep 2026

Completed:
- Full 46-property FabAccommodation dataset remains in Supabase.
- 45 properties have usable supplied photo galleries; 1,350 photo references are stored. 23 Charles Road is the only property without supplied usable photos because its Drive folder is currently empty.
- Public inventory and property enquiries are gated by both `published=true` and partner `acceptance_status='accepted'`.
- Clean dynamic `/properties/:slug/` routes are live.
- Featured accommodation is integrated into the existing homepage hero visual and the duplicated lower carousel was removed.
- Mobile alignment refinements were added without redesigning the approved PCCO page.
- Partner Terms are version `2026-09-26-v1` and state 7.85% + VAT commission plus separate 1.35% eligible processing charge.
- Partner onboarding acceptance is checkbox-based and stores an auditable acceptance record.
- A prior internal/testing acceptance was invalidated and retained as an audit record; its invitation was revoked.
- A replacement FabAccommodation invitation was generated and delivered privately from partners@thepropertycareco.co.uk. FabAccommodation then genuinely accepted Terms version `2026-09-26-v1`; the private token is not committed or exposed in project documentation.
- Invitation records now track delivery timestamp, recipient, Gmail message ID and channel.
- New genuine acceptances record Terms version, timestamp, checkbox confirmation, user agent and an HMAC-hashed IP (never raw IP).
- A full spreadsheet-to-database audit was completed. All 46 cancellation terms are now synced to the host-supplied 14 days.
- 57 Summerleaze had the Drive and Airbnb links entered in opposite spreadsheet columns; the site interprets them correctly and now has a 39-image gallery.
- 7 Calliope Cres omits parking because the spreadsheet parking cell contains bed-configuration text; clarification is required from the host.
- 17 Ellis Court omits bedroom count because the spreadsheet says 4 bedrooms while the supplied bed description describes one bedroom plus an open-plan sleeping area; clarification is required from the host.
- Public nightly pricing is derived only where a host monthly rate exists: `monthly rate / 30 / max sleepers`, rounded up to the next whole pound, shown as an indicative 'From £X per person per night' figure. It explicitly states that the underlying host rate includes linen and bi-weekly cleaning and that prices are subject to host approval and negotiation.

Publication rule:
- FabAccommodation is currently accepted, so all 46 approved property records are eligible for public display through the gated feed.
- Any future partner remains hidden until both the partner acceptance status is accepted and the individual property is marked published.


## Partner intake update — 26 Sep 2026
- Property browse now supports UK postcode/outward-code searches within a 50-mile radius and orders results by distance.
- Homepage Browse Properties CTA now appears above the quick “Build my enquiry” form.
- Fab live cover images now prefer front/exterior imagery first and bedroom imagery second when titles identify those categories; floorplans/bathrooms are not selected as covers. 586 Southmead and 32 Cotsworld floorplan covers were replaced with exterior images.
- Staged privately (not public): Allsquare Stays 5 properties, Vellanor Ltd 4 unique properties, Lanak Property Solutions 1 property, Ceba Property 1 property.
- New partners are pending Terms acceptance and their staged records are marked published=false and requires_partner_acceptance=true.
- Private Terms invitations were sent from the connected partners@thepropertycareco.co.uk Gmail account to all four partners. Invitation tokens are intentionally not stored in this repository/document.
- Ceba was explicitly told that its email mentioning 8% including VAT differs from the standard 7.85% + VAT Terms and should only accept if agreeing to the standard Terms.
- Partner-form automated acknowledgement emails now use the visible sender PCCO Stays Partners <partners@thepropertycareco.co.uk> rather than the Quotes sender.
- An hourly acceptance follow-up watch checks the four pending partners and, after genuine acceptance, sends a non-duplicate thank-you from the connected Partners Gmail mailbox.
- Full photo import/publication for the new staged properties remains blocked until genuine Terms acceptance. Submitted Airbnb metadata may be staged before acceptance, but property photos are not copied for publication before acceptance.
