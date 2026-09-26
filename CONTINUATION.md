# PCCO marketplace continuation — 26 Sep 2026

Current production frontend commit: `2700248d36986e51402e6d30e47d4f41b29189be`.

Completed:
- Full 46-property FabAccommodation dataset remains in Supabase.
- 44 properties have usable supplied photo galleries; 1,311 photo references are stored.
- Public inventory and property enquiries are gated by both `published=true` and partner `acceptance_status='accepted'`.
- Clean dynamic `/properties/:slug/` routes are live.
- Featured accommodation is integrated into the existing homepage hero visual and the duplicated lower carousel was removed.
- Mobile alignment refinements were added without redesigning the approved PCCO page.
- Partner Terms are version `2026-09-26-v1` and state 7.85% + VAT commission plus separate 1.35% eligible processing charge.
- Partner onboarding acceptance is checkbox-based and stores an auditable acceptance record.
- A prior internal/testing acceptance was invalidated and retained as an audit record; its invitation was revoked.
- A replacement FabAccommodation invitation was generated and delivered privately from partners@thepropertycareco.co.uk. The private token must never be committed or exposed in project documentation.
- Invitation records now track delivery timestamp, recipient, Gmail message ID and channel.
- New genuine acceptances record Terms version, timestamp, checkbox confirmation, user agent and an HMAC-hashed IP (never raw IP).

Publication rule:
- FabAccommodation properties remain hidden while its partner status is pending.
- Once FabAccommodation accepts the replacement delivered invitation, the acceptance RPC changes the partner status to accepted and the already-approved 46 records become public automatically through the gated feed.
