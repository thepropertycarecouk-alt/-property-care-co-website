import test from "node:test";
import assert from "node:assert/strict";
import { priceFor, packages } from "../public/host-solutions/catalog.js";
import { validateBrief } from "../lib/host-solutions/consultation.js";
import {
  testKey,
  requireOrigin,
  parseBody,
} from "../lib/host-solutions/security.js";
import {
  checkoutReady,
  depositParameters,
  paidHostSession,
  stripeClient,
} from "../lib/host-solutions/payments.js";
import checkout from "../api/host-checkout.js";
import consultation from "../api/host-consultation.js";
import webhook from "../api/host-stripe-webhook.js";
const fakeTestKey = ["sk", "test", "fixture_only_not_a_real_key"].join("_");
const brief = {
  business: "Test Stays",
  properties: "2–5",
  audience: "Contractors",
  service: "New website",
  style: "Modern",
  goals: "Clearer enquiries",
  name: "Test Person",
  email: "test@example.com",
  phone: "07700 900123",
  contact: "Email",
  consent: true,
};
function response() {
  return {
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
test("exact promotional totals, savings, balances and maintenance", () => {
  const expected = [
    [29925, 9975, 20025, 1400],
    [48750, 16250, 38850, 3400],
    [74625, 24875, 64725, 5000],
  ];
  packages.forEach((p, i) => {
    const x = priceFor(p.id, new Date("2026-11-10"));
    assert.deepEqual(
      [x.total, p.build - x.total, x.balance, x.maintenance],
      expected[i],
    );
    assert.equal(x.deposit + x.balance, x.total);
  });
});
test("promotion includes last millisecond of 31 December, expires in January London time", () => {
  assert.equal(
    priceFor("direct", new Date("2026-12-31T23:59:59.999Z")).total,
    48750,
  );
  const p = priceFor("direct", new Date("2027-01-01T00:00:00Z"));
  assert.equal(p.total, 65000);
  assert.equal(p.maintenance, 3900);
  assert.equal(p.balance, 55100);
});
test("unrecognised package cannot control server price", () =>
  assert.throws(() => priceFor("../../anything")));
test("live keys and production environment are always rejected", () => {
  assert.throws(() =>
    testKey({
      HOST_SOLUTIONS_STRIPE_TEST_KEY: ["sk", "live", "fixture"].join("_"),
    }),
  );
  assert.throws(() =>
    testKey({
      HOST_SOLUTIONS_STRIPE_TEST_KEY: fakeTestKey,
      VERCEL_ENV: "production",
    }),
  );
  assert.equal(
    testKey({ HOST_SOLUTIONS_STRIPE_TEST_KEY: fakeTestKey }),
    fakeTestKey,
  );
});
test("checkout remains closed even with a test key while commercial flags unapproved", () =>
  assert.throws(() =>
    checkoutReady({
      HOST_SOLUTIONS_STRIPE_TEST_KEY: fakeTestKey,
      HOST_SOLUTIONS_CHECKOUT_ENABLED: "test-approved",
    }),
  ));
test("deposit is fixed server-side; maintenance not silently subscribed", () => {
  const p = depositParameters(
    "direct",
    "https://preview.example.com",
    "fixture",
    new Date("2026-11-10"),
  );
  assert.equal(p.mode, "payment");
  assert.equal(p.line_items[0].price_data.unit_amount, 9900);
  assert.equal(p.metadata.balance_pence, "38850");
  assert.equal(p.metadata.maintenance_pence, "3400");
  assert.equal(p.metadata.scope_status, "awaiting-confirmation");
  assert.equal(p.payment_method_types, undefined);
  assert.equal(p.subscription_data, undefined);
});
test("only paid test Host Solutions deposits qualify", () => {
  const s = {
    livemode: false,
    payment_status: "paid",
    currency: "gbp",
    amount_total: 9900,
    metadata: { service: "host-solutions", package: "direct" },
  };
  assert.equal(paidHostSession(s), true);
  for (const patch of [
    { livemode: true },
    { payment_status: "unpaid" },
    { amount_total: 1 },
    { currency: "usd" },
    { metadata: { service: "other" } },
  ])
    assert.equal(paidHostSession({ ...s, ...patch }), false);
});
test("brief validates consent, contact, URL, size and honeypot", () => {
  assert.equal(validateBrief(brief).email, "test@example.com");
  for (const patch of [
    { consent: false },
    { email: "invalid" },
    { phone: "-------" },
    { website: "javascript:alert(1)" },
    { company_fax: "bot" },
    { goals: "x".repeat(1001) },
    { name: "  " },
  ])
    assert.throws(() => validateBrief({ ...brief, ...patch }));
});
test("origin and bounded body validation", () => {
  assert.equal(
    requireOrigin(
      { headers: { origin: "https://preview.example.com" } },
      { HOST_SOLUTIONS_ORIGIN: "https://preview.example.com" },
    ),
    "https://preview.example.com",
  );
  assert.throws(() =>
    requireOrigin(
      { headers: { origin: "https://evil.example" } },
      { HOST_SOLUTIONS_ORIGIN: "https://preview.example.com" },
    ),
  );
  assert.throws(() => parseBody({ body: "x".repeat(12001) }));
  assert.throws(() => parseBody({ body: "[]" }));
});
test("disabled endpoints fail closed without network calls", async () => {
  for (const fn of [checkout, consultation]) {
    const res = response();
    await fn({ method: "POST", headers: {}, body: brief }, res);
    assert.equal(res.code, 503);
    assert.equal(res.headers["Cache-Control"], "no-store");
  }
});
test("webhook signature rejects tampering and unsigned requests", async () => {
  const stripe = stripeClient({ HOST_SOLUTIONS_STRIPE_TEST_KEY: fakeTestKey });
  const payload = JSON.stringify({
    id: "evt_fixture",
    livemode: false,
    type: "checkout.session.completed",
    data: { object: {} },
  });
  const secret = "fixture_signing_secret";
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.equal(
    stripe.webhooks.constructEvent(payload, header, secret).id,
    "evt_fixture",
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload + " ", header, secret),
  );
  const res = response();
  await webhook({ method: "POST", headers: {} }, res);
  assert.equal(res.code, 400);
});
