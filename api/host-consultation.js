import { json, requireOrigin, parseBody } from "../lib/host-solutions/security.js";
import { validateBrief } from "../lib/host-solutions/consultation.js";
import { formConfigured, issueChallenge, verifyChallenge, readCookie } from "../lib/host-solutions/form-challenge.js";
import { consumeLeadNonce, rateLimiterHealthy } from "../lib/host-solutions/lead-throttle.js";

// This route delivers only an explicitly requested consultation to the fixed PCCO mailbox.
// No customer marketing or automatic customer confirmation is sent.
export default async function handler(req, res) {
  if (req.method === "GET") {
    if (!formConfigured() || !(await rateLimiterHealthy()))
      return json(res, 200, { enabled: false });
    const token = issueChallenge(process.env.HOST_SOLUTIONS_FORM_SIGNING_SECRET);
    res.setHeader("Set-Cookie", "hs_form=" + token + "; Path=/api/host-consultation; Max-Age=1800; Secure; HttpOnly; SameSite=Strict");
    return json(res, 200, { enabled: true });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Method not allowed" });
  }
  if (!formConfigured())
    return json(res, 503, { error: "Direct enquiry delivery is unavailable. Please use email." });
  let brief, challenge;
  try {
    requireOrigin(req);
    const data = parseBody(req);
    brief = validateBrief(data);
    challenge = verifyChallenge(
      readCookie(req.headers.cookie, "hs_form"),
      process.env.HOST_SOLUTIONS_FORM_SIGNING_SECRET,
    );
  } catch {
    return json(res, 400, { error: "Please refresh the form, check your details and try again." });
  }

  // Persistent nonce consumption and per-IP quotas precede email delivery.
  try {
    const permitted = await consumeLeadNonce(req, challenge.nonce);
    if (!permitted) {
      res.setHeader("Retry-After", "3600");
      return json(res, 429, {
        error: "Too many enquiries or this request was already submitted. Please contact PCCO directly.",
      });
    }
  } catch {
    return json(res, 503, {
      error: "Secure delivery could not be verified. Please use the prepared email.",
    });
  }

  const nameMap = {
    business: "Host / company", properties: "Properties", audience: "Main audience",
    website: "Website / listing", service: "Service", style: "Design style",
    colours: "Brand colours", goals: "Goals", integrations: "Integrations",
    notes: "Other information", name: "Contact name", email: "Contact email",
    phone: "Telephone / WhatsApp", contact: "Preferred contact method",
  };
  const body = Object.entries(nameMap)
    .map(([key, label]) => label + ": " + (brief[key] || "Not supplied"))
    .join("\n") +
    "\n\nConsent: visitor explicitly requested a consultation and follow-up only. No marketing consent." +
    "\nSubmission: PCCO Host Solutions secure web form.";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.HOST_SOLUTIONS_RESEND_KEY,
        "Content-Type": "application/json",
        "Idempotency-Key": "pcco-host-lead-" + challenge.nonce,
      },
      body: JSON.stringify({
        from: process.env.HOST_SOLUTIONS_EMAIL_FROM,
        to: ["partners@thepropertycareco.co.uk"],
        reply_to: brief.email,
        subject: "PCCO Host Solutions — consultation enquiry",
        text: body,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw Error("Email delivery provider unavailable");
    return json(res, 200, { received: true });
  } catch {
    return json(res, 503, { error: "Your enquiry could not be delivered. Please use the prepared email link." });
  }
}
