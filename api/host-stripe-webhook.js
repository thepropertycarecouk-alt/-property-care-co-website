import { json, redis } from "../lib/host-solutions/security.js";
import {
  stripeClient,
  paidHostSession,
} from "../lib/host-solutions/payments.js";
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  if (req.method !== "POST")
    return json(res, 405, { error: "Method not allowed" });
  let event;
  try {
    const stripe = stripeClient();
    if (!process.env.HOST_SOLUTIONS_STRIPE_WEBHOOK_SECRET) throw Error();
    const chunks = [];
    let length = 0;
    for await (const chunk of req) {
      length += chunk.length;
      if (length > 262144) throw Error();
      chunks.push(Buffer.from(chunk));
    }
    event = stripe.webhooks.constructEvent(
      Buffer.concat(chunks),
      req.headers["stripe-signature"],
      process.env.HOST_SOLUTIONS_STRIPE_WEBHOOK_SECRET,
    );
    if (event.livemode) throw Error();
  } catch {
    return json(res, 400, { error: "Invalid test webhook" });
  }
  try {
    const object = event.data.object;
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
      ].includes(event.type) &&
      paidHostSession(object)
    ) {
      // Atomic SET NX makes duplicate deliveries harmless. No automatic build or email.
      await redis([
        "SET",
        `hs:deposit:${object.id}`,
        JSON.stringify({
          eventId: event.id,
          package: object.metadata.package,
          balancePence: Number(object.metadata.balance_pence),
          status: "paid-awaiting-scope",
          test: true,
        }),
        "NX",
      ]);
    } else if (
      event.type === "checkout.session.async_payment_failed" &&
      object.metadata?.service === "host-solutions"
    ) {
      await redis([
        "SET",
        `hs:failure:${object.id}`,
        JSON.stringify({
          eventId: event.id,
          status: "payment-failed",
          test: true,
        }),
        "NX",
      ]);
    }
    return json(res, 200, { received: true });
  } catch {
    return json(res, 503, { error: "Storage unavailable; retry delivery." });
  }
}
