import { randomUUID } from "node:crypto";
import {
  json,
  requireOrigin,
  parseBody,
  rateLimit,
  redis,
} from "../lib/host-solutions/security.js";
import {
  checkoutReady,
  stripeClient,
  depositParameters,
} from "../lib/host-solutions/payments.js";
import { paymentMode } from "../lib/host-solutions/security.js";
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }
  try {
    checkoutReady();
  } catch {
    return json(res, 503, {
      error:
        "Checkout is closed pending approved terms and verified Stripe configuration.",
    });
  }
  let origin, data;
  try {
    origin = requireOrigin(req);
    data = parseBody(req);
    if (
      data.acceptTerms !== true ||
      !["starter", "direct", "portfolio"].includes(data.package)
    )
      throw Error();
  } catch {
    return json(res, 400, { error: "Invalid package, origin or agreement." });
  }
  try {
    await rateLimit(req, "checkout");
    const token = randomUUID(),
      stripe = stripeClient();
    const session = await stripe.checkout.sessions.create(
      depositParameters(data.package, origin, token),
      { idempotencyKey: token },
    );
    if (
      session.livemode !== (paymentMode() === "live") ||
      !session.url?.startsWith("https://checkout.stripe.com/")
    )
      throw Error();
    await redis(["SET", `hs:${paymentMode()}:session:${token}`, session.id, "EX", 86400]);
    res.setHeader(
      "Set-Cookie",
      `hs_checkout=${token}; HttpOnly; Secure; SameSite=Lax; Path=/api/host-payment-status; Max-Age=86400`,
    );
    return json(res, 200, { url: session.url });
  } catch {
    return json(res, 503, {
      error: "Checkout is unavailable. No project has been started.",
    });
  }
}
