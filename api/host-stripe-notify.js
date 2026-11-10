import { json } from "../lib/host-solutions/security.js";
import { verifyStripeEvent, describeHostEvent } from "../lib/host-solutions/stripe-notifications.js";
import { claimStripeAlert, markStripeAlertDelivered } from "../lib/host-solutions/notice-ledger.js";

export const config = { api: { bodyParser: false } };

// Stripe-hosted Payment Links work without an API secret; a signed webhook plus a
// restricted email key provides internal payment/failed-payment notifications.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }
  if (process.env.HOST_SOLUTIONS_WEBHOOK_ENABLED !== "approved" ||
      !process.env.HOST_SOLUTIONS_STRIPE_NOTIFY_SECRET?.startsWith("whsec_") ||
      !process.env.HOST_SOLUTIONS_RESEND_KEY)
    return json(res, 503, { error: "Notification delivery unavailable" });

  let event;
  try {
    const chunks = [];
    let total = 0;
    for await (const chunk of req) {
      total += chunk.length;
      if (total > 262144) throw Error("Payload too large");
      chunks.push(Buffer.from(chunk));
    }
    event = verifyStripeEvent(
      Buffer.concat(chunks),
      req.headers["stripe-signature"],
      process.env.HOST_SOLUTIONS_STRIPE_NOTIFY_SECRET,
    );
  } catch {
    return json(res, 400, { error: "Invalid webhook signature" });
  }
  const notice = describeHostEvent(event);
  if (!notice) return json(res, 200, { received: true });

  try {
    const claimed = await claimStripeAlert(event.id);
    if (claimed.state === "done") return json(res, 200, {received:true});
    if (claimed.state !== "claimed") return json(res, 503, {error:"Event already processing; retry"});
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.HOST_SOLUTIONS_RESEND_KEY,
        "Content-Type": "application/json",
        "Idempotency-Key": "pcco-host-stripe-" + event.id,
      },
      body: JSON.stringify({
        from: process.env.HOST_SOLUTIONS_EMAIL_FROM,
        to: ["partners@thepropertycareco.co.uk"],
        subject: notice.subject,
        text: notice.text + "\n\nStripe event: " + event.id,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw Error("Email provider unavailable");
    await markStripeAlertDelivered(claimed.hash);
    return json(res, 200, { received: true });
  } catch {
    // Stripe retries non-2xx responses; the private ledger grants one active
    // delivery lease and records completed internal alerts for 90 days.
    return json(res, 503, { error: "Notification not delivered; retry" });
  }
}
