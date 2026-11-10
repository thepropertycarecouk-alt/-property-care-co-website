import Stripe from "stripe";
import { priceFor, launchTerms } from "../../public/host-solutions/catalog.js";
import { testKey, liveKey, paymentMode } from "./security.js";

// Match the key to deployment environment. No preview checkout can use a live key.
export function stripeClient(env = process.env) {
  return new Stripe(paymentMode(env) === "live" ? liveKey(env) : testKey(env), {
    apiVersion: "2026-09-30.endive",
    maxNetworkRetries: 1,
  });
}
export function checkoutReady(env = process.env) {
  const mode = paymentMode(env);
  if (mode === "live") liveKey(env);
  else testKey(env);
  if (
    env.HOST_SOLUTIONS_CHECKOUT_ENABLED !==
      (mode === "live" ? "live-approved" : "test-approved") ||
    !Object.values(launchTerms).every(Boolean)
  ) throw Error("Commercial approval pending");
  if (
    !env.HOST_SOLUTIONS_STRIPE_WEBHOOK_SECRET ||
    !env.HOST_SOLUTIONS_REDIS_URL ||
    !env.HOST_SOLUTIONS_REDIS_TOKEN ||
    !env.HOST_SOLUTIONS_PAYMENT_METHOD_CONFIG ||
    !env.HOST_SOLUTIONS_STRIPE_TAX_CODE ||
    env.HOST_SOLUTIONS_TAX_READY !== "verified" ||
    !/^https:\/\/[^/]+$/.test(env.HOST_SOLUTIONS_ORIGIN || "")
  ) throw Error("Payment, tax, or origin infrastructure unavailable");
  return true;
}
export function depositParameters(id, origin, requestId, now = new Date(), env = process.env) {
  const p = priceFor(id, now);
  return {
    mode: "payment",
    customer_creation: "always",
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    automatic_tax: { enabled: true },
    payment_method_configuration: env.HOST_SOLUTIONS_PAYMENT_METHOD_CONFIG,
    client_reference_id: requestId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: 9900,
          tax_behavior: "inclusive",
          product_data: {
            name: `PCCO ${p.name} website deposit`,
            description: `£99 VAT-inclusive credit towards £${(p.total / 100).toFixed(2)} build. Remaining £${(p.balance / 100).toFixed(2)}; monthly charges separate.`,
            ...(env.HOST_SOLUTIONS_STRIPE_TAX_CODE ? { tax_code: env.HOST_SOLUTIONS_STRIPE_TAX_CODE } : {}),
          },
        },
      },
    ],
    metadata: {
      service: "host-solutions",
      package: id,
      vat_inclusive: "true",
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
export function paidHostSession(session, expectedLivemode = false) {
  return (
    session.livemode === expectedLivemode &&
    session.payment_status === "paid" &&
    session.currency === "gbp" &&
    session.amount_total === 9900 &&
    session.metadata?.vat_inclusive === "true" &&
    session.metadata?.service === "host-solutions" &&
    ["starter", "direct", "portfolio"].includes(session.metadata?.package)
  );
}
