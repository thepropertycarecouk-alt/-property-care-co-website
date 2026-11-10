# PCCO Host Solutions — execution plan
Date: 10 November 2026. Owner: Sandeep. Repository: thepropertycarecouk-alt/-property-care-co-website. Vercel: pcc-live-site-260825.

## Non-negotiable safeguards
Preview only. Never merge main, promote a deployment, attach production domains, enable live payments or send development emails without explicit owner approval. Preserve all existing accommodation, cleaning, landlord, partner, SEO, enquiry and AI routes. Never store credentials or customer data in Git. Development branch: feature/host-solutions-complete, based on prototype 950baab (main bcd3ab9). Existing prototype reviewed: three-step client-side brief, review and mailto only; navigation link exists only in feature branch.

## Scope and design
Build /host-solutions/ with PCCO logo, deep navy #021b3c, gold #c5a168, cream and white. Premium spacious product presentation, accessible typography, restrained motion, keyboard controls and mobile-specific comparisons. Sections: hero; free mockup; pricing; detailed comparison with feature explanations; standalone AI; interactive safe demo; direct-booking/listing optimisation; partial/full co-hosting; Discover → Design → Build → Test → Launch → Support; verified PCCO Stays example; FAQs; contact/guided consultation. No invented testimonials, results, client logos, scarcity or live availability.

## Exact commercial schedule
All build fees one-off. Opening offer through 31 December 2026 inclusive, Europe/London.
|Package|Build original|Offer|Saving|Maintenance original/month|Offer/month|Deposit|Remaining|
|---|---:|---:|---:|---:|---:|---:|---:|
|Starter|£399|£299.25|£99.75 (25%)|£19|£14|£99|£200.25|
|Direct Booking (recommended)|£650|£487.50|£162.50 (25%)|£39|£34|£99|£388.50|
|Portfolio Pro|£995|£746.25|£248.75 (25%)|£55|£50|£99|£647.25|
Original prices struck through immediately next to prominent offers; green saving. Deposit part of total. After deadline restore standard pricing and balances. Website package build/deposit/monthly prices approved VAT-INCLUSIVE on 10 November 2026. £5 monthly discount duration NOT yet approved (lifetime versus defined term). Never silently select either; payment gate stays closed pending both.

Starter: up to five listings; mobile branded accommodation site; photos/descriptions/amenities; contact/enquiry forms; WhatsApp link; basic SEO/analytics; hosting/SSL; onboarding/handover; 14-day opt-in AI trial, no automatic paid continuation.
Direct Booking: all Starter; five designed property pages; galleries; mobile enquiries; contractor/corporate journeys; search/filter; direct booking enquiries; supported booking-engine/channel-manager standard setup; notifications; guest information and digital guide; location SEO; Search Console; analytics; launch consultation/training. Optional AI £75 setup + £10/month, explicitly agreed after trial.
Portfolio Pro: all Direct Booking; ten listings; advanced presentation; multiple location pages; contractor/corporate landing pages; group/multi-property enquiries; included standard AI, recommendations from published inventory where supported, lead qualification and email notifications; tracking; booking/dynamic pricing integration assistance; advanced SEO foundations/appropriate structured data; guest information; implementation consultation; priority support; agreed maintenance allowances; full handover. AI fair-use allowance must be published and approved before sale.
Standalone AI: £150 setup + £20/month, existing sites welcome; branding/install, natural conversations, dates/requirements/contact capture, qualification, accessible-inventory recommendations, notifications, 24/7 automated capture, operator handover, standard maintenance. Fair-use allowance to approve. Voice, WhatsApp automation, bespoke PMS and high volumes extra.
Co-hosting: Partial 8.5%, Full 15% of agreed accommodation revenue + VAT where applicable. Consultation/property assessment/signed scope required. Talk to Us buttons only. Partial listing/pricing/messaging/booking/reporting/digital support. Full adds operational/check-in/cleaning/linen/maintenance coordination and expanded support.

## Lead and payment journeys
Free discovery + consultation + one homepage mockup + two design directions + initial structure/enquiry journey/integration/AI recommendations and project brief; no unlimited work. Guided form collects business, property count, links, audience, services, style, colours, goals, integrations, contact name/email/phone/preference; review, edit, consent, spam protection, confirmation. Development simulation explicitly never sends. Production submission to partners@thepropertycareco.co.uk remains gated until secure service/privacy/retention configured.
Checkout: package review, £99 deposit and outstanding balance, recurring fees separately authorised, terms acknowledgement; server-only Stripe test secret, no live key accepted; trusted origin, server pricing, webhook signature/replay handling, verified confirmation, onboarding only after requirements/scope agreed. No finance. Never treat a redirect as proof of payment. Stripe connection currently live only; no Stripe Vercel variables. Prepare integration but do not claim real test payment success without test credentials. Durable webhook/lead storage and receipt/failed-payment/portal workflows required before launch.

## Architecture
Retain buildless HTML/CSS/JS public directory and Vercel Node APIs. Isolate assets under public/host-solutions; no changes to existing AI API. Shared commercial configuration used by frontend and server where feasible. Local deterministic demo avoids API costs and personal data. New APIs fail closed when configuration absent. Existing build copies public to dist. Existing main navigation link preview only until branch approved/merged.

## Milestones and acceptance
1. Inspect source/prototype/deployment, save plan/progress/handoff and branch.
2. Implement page, pricing/comparisons, complete content, guided consultation, safe demo and checkout review; commit.
3. Add isolated test-only server payment foundations and validation/security tests; commit.
4. Build, responsive desktop/mobile/keyboard QA, verify old routes unchanged, deploy Vercel preview, draft PR; record SHA/URL/test results and blockers.
Launch requires owner signoff on finished preview, verified Stripe Tax registration (website pricing is already VAT-inclusive), monthly offer duration, payment schedule/refunds, AI fair use, maintenance allowances, support/cancellation/design revision terms, lead privacy/retention, real Stripe test end-to-end and live activation. Navigation/SEO launch changes only after approval.
