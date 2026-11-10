import Stripe from "stripe";
import { priceFor, launchTerms } from "../../public/host-solutions/catalog.js";
import { testKey } from "./security.js";
export function stripeClient(env = process.env) {
  return new Stripe(testKey(env), {
    apiVersion: "2026-09-30.endive",
    maxNetworkRetries: 1,
  });
}
export function checkoutReady(env = process.env) {
  testKey(env);
  if (
    env.HOST_SOLUTIONS_CHECKOUT_ENABLED !== "test-approved" ||
    !Object.values(launchTerms).every(Boolean)
  )
    throw Error("Commercial approval pending");
  if (
    !env.HOST_SOLUTIONS_STRIPE_WEBHOOK_SECRET ||
    !env.HOST_SOLUTIONS_REDIS_URL ||
    !env.HOST_SOLUTIONS_REDIS_TOKEN ||
    !env.HOST_SOLUTIONS_PAYMENT_METHOD_CONFIG
  )
    throw Error("Checkout infrastructure unavailable");
}
export function depositParameters(id, origin, requestId, now = new Date()) {
  const p = priceFor(id, now);
  return {
    mode: "payment",
    customer_creation: "always",
    payment_method_configuration:
      process.env.HOST_SOLUTIONS_PAYMENT_METHOD_CONFIG,
    integration_identifier: "pcco_host_deposit_qkmtwzra",
    client_reference_id: requestId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: 9900,
          product_data: {
            name: `PCCO ${p.name} website deposit`,
            description: `Part of ${p.total / 100} GBP build. Remaining ${p.balance / 100} GBP; scope and payment schedule separately agreed.`,
          },
        },
      },
    ],
    metadata: {
      service: "host-solutions",
      package: id,
      build_pence: String(p.total),
      balance_pence: String(p.balance),
      maintenance_pence: String(p.maintenance),
      promotion: p.promo ? "launch-2026" : "standard",
      scope_status: "awaiting-confirmation",
    },
    success_url: `${origin}/host-solutions/confirmation/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/host-solutions/#websites`,
  };
}
export function paidHostSession(session) {
  return (
    session.livemode === false &&
    session.payment_status === "paid" &&
    session.currency === "gbp" &&
    session.amount_total === 9900 &&
    session.metadata?.service === "host-solutions" &&
    ["starter", "direct", "portfolio"].includes(session.metadata?.package)
  );
}
