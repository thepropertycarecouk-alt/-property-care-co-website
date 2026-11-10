import {
  json,
  requireOrigin,
  parseBody,
  rateLimit,
} from "../lib/host-solutions/security.js";
import { validateBrief } from "../lib/host-solutions/consultation.js";
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }
  // Explicit delivery gate: not set during development. Frontend stays local preview.
  if (process.env.HOST_SOLUTIONS_LEADS_ENABLED !== "approved")
    return json(res, 503, { error: "Preview only. No enquiry was sent." });
  try {
    requireOrigin(req);
  } catch {
    return json(res, 403, { error: "Request not permitted" });
  }
  let data, brief;
  try {
    data = parseBody(req);
    brief = validateBrief(data);
  } catch {
    return json(res, 400, { error: "Please check your details and consent." });
  }
  try {
    await rateLimit(req, "lead");
    if (
      !process.env.HOST_SOLUTIONS_TURNSTILE_SECRET ||
      !process.env.HOST_SOLUTIONS_RESEND_KEY ||
      !process.env.HOST_SOLUTIONS_EMAIL_FROM ||
      typeof data.challenge !== "string"
    )
      throw Error();
    const challenge = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.HOST_SOLUTIONS_TURNSTILE_SECRET,
          response: data.challenge,
        }),
        signal: AbortSignal.timeout(8000),
      },
    ).then((r) => r.json());
    if (
      !challenge.success ||
      challenge.hostname !==
        new URL(process.env.HOST_SOLUTIONS_ORIGIN).hostname ||
      challenge.action !== "host-consultation"
    )
      return json(res, 400, {
        error: "Please complete the spam-prevention check.",
      });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HOST_SOLUTIONS_RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.HOST_SOLUTIONS_EMAIL_FROM,
        to: ["partners@thepropertycareco.co.uk"],
        subject: "PCCO Host Solutions consultation request",
        reply_to: brief.email,
        text:
          Object.entries(brief)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n") + "\nConsent: request follow-up only; no marketing.",
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw Error();
    return json(res, 200, { received: true });
  } catch {
    return json(res, 503, {
      error: "Your request could not be delivered. Please try again later.",
    });
  }
}
