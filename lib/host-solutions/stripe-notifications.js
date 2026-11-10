import { createHmac, timingSafeEqual } from "node:crypto";

// Allow only verified PCCO Host Solutions Payment Link IDs: no notifications about unrelated merchant charges.
export const checkoutLinks = Object.freeze({
  plink_1UaJtCAuxFu0m9QL1E6Bp2BH: ["Starter website opening deposit", 9900],
  plink_1UaJtYAuxFu0m9QLQKxPgNxk: ["Direct Booking website opening deposit", 9900],
  plink_1UaJtbAuxFu0m9QLrj7gCtMu: ["Portfolio Pro website opening deposit", 9900],
  plink_1UaLj9AuxFu0m9QLT1urHfSp: ["Starter website standard deposit", 9900],
  plink_1UaLjBAuxFu0m9QLYmHDFIsO: ["Direct Booking website standard deposit", 9900],
  plink_1UaLjDAuxFu0m9QLtn87ucAb: ["Portfolio Pro website standard deposit", 9900],
  plink_1UaLZLAuxFu0m9QLvgHSvNbU: ["Standalone AI setup", 15000],
  plink_1UaLZNAuxFu0m9QLrHPQNQSL: ["Direct Booking AI setup", 7500],
  plink_1UaLhSAuxFu0m9QLoikN9xkG: ["Starter website opening balance", 20025],
  plink_1UaLhUAuxFu0m9QLGqaXP0Xm: ["Direct Booking website opening balance", 38850],
  plink_1UaLhWAuxFu0m9QLTbMizBpK: ["Portfolio Pro website opening balance", 64725],
  plink_1UaLZyAuxFu0m9QLKw75zXuy: ["Standalone AI monthly subscription", 2000, 2000],
  plink_1UaLa1AuxFu0m9QLwy8Vo5b6: ["Direct Booking AI monthly subscription", 1000, 1000],
  plink_1UaLa3AuxFu0m9QLOODhCsVG: ["Starter website monthly maintenance", 1900, 1400],
  plink_1UaLa5AuxFu0m9QLGFsj3M5Z: ["Direct Booking website monthly maintenance", 3900, 3400],
  plink_1UaLa7AuxFu0m9QL7BSOglp8: ["Portfolio Pro website monthly maintenance", 5500, 5000],
});
const products = new Set([
  "prod_VbYdMrhpfwwYGD", "prod_VbYeeAYgyPeANP",
  "prod_VbYeuyG3GEQMxQ", "prod_VbYeNcN2XZjt5y", "prod_VbYe28pSqI57zR",
]);

export function verifyStripeEvent(raw, header, secret, now = Date.now()) {
  if (!secret || !secret.startsWith("whsec_") || !Buffer.isBuffer(raw) || raw.length > 262144)
    throw Error("Webhook configuration or payload invalid");
  const parts = String(header || "").split(",").map(x => x.trim());
  const timestampPart = parts.find(x => x.startsWith("t="));
  const timestamp = Number(timestampPart?.slice(2));
  if (!Number.isSafeInteger(timestamp) || Math.abs(now / 1000 - timestamp) > 300)
    throw Error("Webhook timestamp invalid");
  const expected = createHmac("sha256", secret)
    .update(String(timestamp) + ".").update(raw).digest();
  const valid = parts.filter(x => /^v1=[a-f0-9]{64}$/.test(x)).some(x =>
    timingSafeEqual(expected, Buffer.from(x.slice(3), "hex"))
  );
  if (!valid) throw Error("Webhook signature invalid");
  const event = JSON.parse(raw.toString("utf8"));
  if (event.object !== "event" || !/^evt_[A-Za-z0-9]+$/.test(event.id || ""))
    throw Error("Webhook payload invalid");
  return event;
}

function money(pence) {
  return Number.isInteger(pence) ? "£" + (pence / 100).toFixed(2) : "Amount unavailable";
}
function productMatches(lines) {
  return Array.isArray(lines?.data) &&
    lines.data.some(line => products.has(typeof line?.price?.product === "string"
      ? line.price.product : line?.pricing?.price_details?.product));
}
function redact(value) {
  return String(value || "Not supplied").replace(/[\r\n\t]/g, " ").slice(0, 180);
}

export function describeHostEvent(event) {
  if (!event || event.livemode !== true) return null;
  const obj = event.data?.object;
  if (!obj || obj.livemode !== true) return null;

  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    const link = checkoutLinks[obj.payment_link];
    if (!link || obj.currency !== "gbp" || obj.payment_status !== "paid" ||
      !link.slice(1).includes(obj.amount_total)) return null;
    return {
      subject: "PCCO Host Solutions — payment received",
      text: "Payment category: " + link[0] +
        "\nPaid: " + money(obj.amount_total) +
        "\nStripe checkout session: " + redact(obj.id) +
        "\nCustomer email: " + redact(obj.customer_details?.email) +
        "\nPayment Link: " + redact(obj.payment_link) +
        "\nNext step: review payment and agreed scope in Stripe; contact the customer manually after approving the reply." +
        "\nNo service activation is automatic.",
    };
  }

  if (["invoice.paid", "invoice.payment_failed"].includes(event.type)) {
    if (!productMatches(obj.lines)) return null;
    // First subscription checkout generates an additional checkout notification.
    if (event.type === "invoice.paid" && obj.billing_reason === "subscription_create") return null;
    return {
      subject: "PCCO Host Solutions — " + (event.type === "invoice.paid" ? "monthly invoice paid" : "monthly payment failed"),
      text: "Stripe invoice: " + redact(obj.id) +
        "\nCustomer: " + redact(obj.customer_email || obj.customer) +
        "\nAmount due: " + money(obj.amount_due) +
        "\nAmount paid: " + money(obj.amount_paid) +
        "\nAction: review the subscription in Stripe and follow up when required. Do not automatically disable a customer service.",
    };
  }

  if (["customer.subscription.deleted", "customer.subscription.updated"].includes(event.type)) {
    if (!Array.isArray(obj.items?.data) ||
      !obj.items.data.some(item => products.has(item?.price?.product))) return null;
    if (event.type === "customer.subscription.updated" &&
      !["past_due", "unpaid", "canceled", "paused"].includes(obj.status) &&
      !obj.cancel_at_period_end) return null;
    return {
      subject: "PCCO Host Solutions — subscription " + redact(obj.status),
      text: "Stripe subscription: " + redact(obj.id) +
        "\nCustomer: " + redact(obj.customer) +
        "\nStatus: " + redact(obj.status) +
        "\nCancellation at period end: " + (obj.cancel_at_period_end ? "Yes" : "No") +
        "\nAction: verify the end date and service obligations before changing the customer's website or assistant.",
    };
  }
  return null;
}
