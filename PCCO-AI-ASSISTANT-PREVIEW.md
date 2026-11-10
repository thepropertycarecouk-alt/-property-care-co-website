# PCCO AI Booking Assistant — development preview

## Status
This is a **real language-model-backed chatbot**, not a fixed questionnaire. It is **not enabled on the production website**. It appears only when a preview website URL includes `?ai_preview=1`. The private preview now supports explicit, consented **real test enquiries** through the website's existing accommodation endpoint; nothing is sent merely by chatting.

## Architecture
- `public/stays/ai-assistant.js`: branded chat UI, free-text conversation, automatic/manual published property matching (no extra model requests), selectable property cards, prefilled enquiry review and explicit consent-gated submission.
- `api/stays-ai.js`: Vercel serverless API which calls the OpenAI Responses API and requests structured JSON containing a natural reply and extracted enquiry details.
- `public/stays/index.html`: includes the widget script, which exits immediately unless preview is requested.

The API key **must never be placed in browser JavaScript or this repository**.

## Required configuration
1. Obtain an OpenAI API key in the **business's own** account.
2. In Vercel project `pcc-live-site-260825`, set `OPENAI_API_KEY` as a **server-side environment variable for Preview only** while testing.
3. The preview currently defaults to `gpt-6-luna` (or the server's optional `PCCO_AI_MODEL` override).
4. Redeploy the feature branch, open the protected preview deployment URL with `?ai_preview=1`.
5. Test conversational corrections, unexpected questions, date ambiguity, financial information, property-specific questions, and rapid repeated prompts.
6. Add rate limiting, agreed privacy notice and costs/usage monitoring before moving from private testing to a public production endpoint.
7. Preview submissions reuse the **existing** `pcc-accommodation` Supabase Edge Function, which saves the brief in `accommodation_enquiries` and attempts notification to `stays@thepropertycareco.co.uk` plus a customer copy. The UI respects `notification_sent.owner`, distinguishing saved enquiry from confirmed email notification. No test enquiry is sent until the visitor checks consent and presses Send Enquiry.
8. Live calendars are **not connected**: published properties are candidate matches only. The feed and postcode radius search are separate from OpenAI, so listings and sending incur no OpenAI token charges. Verify full property fit, exact beds, parking, prices and availability manually.
9. To launch, approve privacy wording, real traffic protection / rate-limiting, usability and email deliverability, and explicitly enable the UI on production **only after the owner reviews and approves** the result.

## Operating guardrails
- Unknown availability/rates/amenities are not invented. The bot collects details and clearly says PCCO must confirm.
- Uses `store:false` with model requests; the service provider still processes the text, so public privacy wording must be approved.
- Enquiry summary data remains in browser session for review; do not collect payment information or access codes.
- Preview does not send anything automatically. **Only explicit Send Enquiry after visitor consent** creates a real database record and triggers a notification attempt. Do not test with third-party personal data without their permission. If a notification fails after database save, never suggest sending again blindly.

## Manual review scenarios
- Family relocation to Harrow, 2 adults / 2 children, 6 weeks, parking, flexible budget.
- Contractor booking for 8 workers in Manchester requiring 8 separate beds.
- Guest corrects Manchester → Liverpool, 6 weeks → 8 weeks.
- Guest asks whether a specific property is free tomorrow (must not invent).
- Guest starts with questions about the service before giving booking information.
- Guest asks to book immediately (must hand off to PCCO).
- Model unavailable / missing API key: should show a useful failure message and existing enquiry form alternative.

## Existing site safeguards
The existing standard accommodation form, property listings and Cleaning division are unchanged. The current Vercel build copies `public/stays/index.html` to `public/index.html` and includes the new JavaScript automatically.
