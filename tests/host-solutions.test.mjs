import test from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { priceFor, packages, vatCharged, monthlyDiscountMonths, depositRefundDays, aiFairUse } from "../public/host-solutions/catalog.js";
import { depositLinks, standardDepositLinks, depositLinkFor } from "../public/host-solutions/deposit-links.js";
import { standaloneAiSetupLink, customerBillingPortalLink } from "../public/host-solutions/stripe-links.js";
import { validateBrief } from "../lib/host-solutions/consultation.js";
import {
  testKey,
  liveKey,
  paymentMode,
  requireOrigin,
  parseBody,
} from "../lib/host-solutions/security.js";
import {
  checkoutReady,
  depositParameters,
  paidHostSession,
  stripeClient,
} from "../lib/host-solutions/payments.js";
import consultation from "../api/host-consultation.js";
import { issueChallenge, verifyChallenge, formConfigured } from "../lib/host-solutions/form-challenge.js";
import { verifyStripeEvent, describeHostEvent } from "../lib/host-solutions/stripe-notifications.js";
import stripeNotify from "../api/host-stripe-notify.js";
import { createHmac } from "node:crypto";
import { Readable } from "node:stream";
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
test("test/live keys are isolated by environment", () => {
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
  const fakeLive = ["sk", "live", "fixture_not_a_real_key"].join("_");
  assert.equal(liveKey({VERCEL_ENV: "production",HOST_SOLUTIONS_STRIPE_LIVE_KEY:fakeLive}),fakeLive);
  assert.throws(() => liveKey({HOST_SOLUTIONS_STRIPE_LIVE_KEY:fakeLive}));
  assert.throws(() => liveKey({VERCEL_ENV:"production",HOST_SOLUTIONS_STRIPE_LIVE_KEY:fakeTestKey}));
  assert.equal(paymentMode({VERCEL_ENV:"production"}),"live");
  assert.equal(paymentMode({VERCEL_ENV:"preview"}),"test");
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
  assert.equal(p.line_items[0].price_data.tax_behavior, "inclusive");
  assert.equal(p.automatic_tax.enabled, true);
  assert.equal(p.metadata.vat_inclusive, "true");
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
    metadata: { service: "host-solutions", package: "direct", vat_inclusive: "true" },
  };
  assert.equal(paidHostSession(s), true);
  assert.equal(paidHostSession({...s,livemode:true}, true), true);
  assert.equal(paidHostSession(s, true), false);
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
test("disabled direct consultation POST fails closed without email credentials", async () => {
  const res=response();
  await consultation({method:"POST",headers:{},body:brief},res);
  assert.equal(res.code,503);
  assert.equal(res.headers["Cache-Control"],"no-store");
});

test("Host Solutions package explanations, AI purchase review and safety gates render in source", () => {
  const html = readFileSync(new URL("../public/host-solutions/index.html", import.meta.url), "utf8");
  const js = readFileSync(new URL("../public/host-solutions/app.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../public/host-solutions/styles.css", import.meta.url), "utf8");
  assert.match(html, /id="package-guide"/);
  assert.match(html, /Enquiries designed for contractors and companies/);
  assert.match(html, /Standard AI booking assistant included/);
  assert.match(html, /id="ai-review-dialog"/);
  assert.match(html, /£150/);
  assert.match(html, /£20\/month/);
  assert.match(html, /id="ai-setup-pay" disabled/);
  assert.match(html, /id="ai-setup-terms"/);
  assert.match(js, /standaloneAiSetupLink/);
  assert.match(js, /monthly-saving/);
  assert.match(css, /\.package-guide-grid/);
  assert.match(html, /Opening offer/);
  assert.doesNotMatch(html, /no VAT charged|no VAT is charged|no VAT added|no VAT charged or added/i);
  assert.match(html, /The displayed website prices are final/);
  assert.match(html, /id="checkout-pay" disabled/);
  assert.match(html, /id="checkout-acceptance"/);
  assert.match(js, /depositLinkFor/);
  assert.match(js, /Continue to Stripe/);
  const cohost = html.split('id="cohosting"')[1].split('id="process"')[0];
  assert.doesNotMatch(cohost, /data-checkout|Stripe|Pay £99 Deposit/);
});

test("launch: non-VAT-registered all-in pricing, six-month maintenance saving and 14-day refund", () => {
  assert.equal(vatCharged, false);
  assert.equal(monthlyDiscountMonths, 6);
  assert.equal(depositRefundDays, 14);
  assert.deepEqual(aiFairUse, {
    standaloneReplies: 1000, directAddonReplies: 500, portfolioReplies: 500, trialReplies: 50,
  });
  const html = readFileSync(new URL("../public/host-solutions/index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("../public/host-solutions/app.js", import.meta.url), "utf8");
  const terms = readFileSync(new URL("../public/host-solutions/terms/index.html", import.meta.url), "utf8");
  const config = readFileSync(new URL("../vercel.json", import.meta.url), "utf8");
  assert.doesNotMatch(html, /VAT[- ]inclusive|VAT included|include VAT|owner preview/i);
  for (const id of ["checkout-dialog", "form-success", "brief-review", "send-brief-email", "copy-brief", "ai-review-dialog", "checkout-terms"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(terms, /14 calendar days/);
  assert.match(terms, /first six paid months/);
  assert.match(app, /mailto:partners@thepropertycareco.co.uk/);
  assert.match(app, /host-consultation"/);
  assert.match(html, /brief-outcome-message/);
  assert.doesNotMatch(app, /host-checkout-config/);
  assert.doesNotMatch(config, /noindex, nofollow/);
  for (const id of ["starter","direct","portfolio"]) assert.match(depositLinks[id], /^https:\/\/book\.stripe\.com\/[A-Za-z0-9]+$/);
  for (const id of ["starter","direct","portfolio"]) assert.match(standardDepositLinks[id], /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/);
});

test("standalone AI setup is one-time and links only to approved Stripe hosts", () => {
  assert.match(standaloneAiSetupLink, /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/);
  assert.match(customerBillingPortalLink, /^https:\/\/billing\.stripe\.com\/p\/login\/[A-Za-z0-9]+$/);
  const source = readFileSync(new URL("../public/host-solutions/index.html", import.meta.url), "utf8");
  assert.match(source, /I am paying £150 once for setup/);
  assert.match(source, /subscription is separate/);
  const terms = readFileSync(new URL("../public/host-solutions/terms/index.html", import.meta.url), "utf8");
  assert.match(terms, /Cancellation takes effect at the end/);
  assert.match(terms, /£5 off for the first six monthly billing periods/);
});

test("post-offer checkout uses standard Stripe deposit links and correct remaining balances", () => {
  for (const [id,balance] of [["starter",30000],["direct",55100],["portfolio",89600]]) {
    const intro = priceFor(id,new Date("2026-12-31T23:59:59.999Z"));
    const standard = priceFor(id,new Date("2027-01-01T00:00:00Z"));
    assert.equal(depositLinkFor(id,intro.promo),depositLinks[id]);
    assert.equal(depositLinkFor(id,standard.promo),standardDepositLinks[id]);
    assert.equal(standard.deposit,9900);
    assert.equal(standard.balance,balance);
    assert.equal(standard.deposit+standard.balance,standard.total);
  }
  assert.equal(depositLinkFor("unknown",true),null);
  const source=readFileSync(new URL("../public/host-solutions/app.js",import.meta.url),"utf8");
  assert.match(source,/depositLinkFor\(p.id, p.promo\)/);
  assert.doesNotMatch(source,/Opening offer ended";/);
});

// Live-adapter tests never send emails, issue charges or require credentials.
test("signed consultation challenge rejects tampering, old tokens and immediate spam", () => {
  const key = "1".repeat(64);
  const now = 1794346200000;
  const token = issueChallenge(key, now, "a".repeat(32));
  assert.equal(verifyChallenge(token,key,now+1900).nonce, "a".repeat(32));
  assert.throws(() => verifyChallenge(token,key,now+200));
  assert.throws(() => verifyChallenge(token,key,now+31*60*1000));
  assert.throws(() => verifyChallenge(token.slice(0,-1)+"0",key,now+1900));
  assert.equal(formConfigured({}),false);
});

test("live lead form capability stays disabled until verified provider and secret are configured", async () => {
  const res = response();
  await consultation({method:"GET",headers:{}},res);
  assert.equal(res.code,200);
  assert.deepEqual(res.body,{enabled:false});
});

test("webhook signatures reject forged and stale events", () => {
  const secret="whsec_test_fixture_not_real";
  const payload=Buffer.from(JSON.stringify({id:"evt_TESTSIGNATURE",object:"event",livemode:true,type:"checkout.session.completed",data:{object:{}}}));
  const at=1794346200000, timestamp=Math.floor(at/1000);
  const signature=createHmac("sha256",secret).update(String(timestamp)+".").update(payload).digest("hex");
  const header="t="+timestamp+",v1="+signature;
  assert.equal(verifyStripeEvent(payload,header,secret,at).id,"evt_TESTSIGNATURE");
  assert.throws(()=>verifyStripeEvent(Buffer.concat([payload,Buffer.from(" ")]),header,secret,at));
  assert.throws(()=>verifyStripeEvent(payload,header,secret,at+10*60*1000));
});

test("webhook accepts only the correct PCCO payment links and expected amounts", () => {
  function event(link,amount,kind="checkout.session.completed"){
    return {id:"evt_TEST",object:"event",type:kind,livemode:true,data:{object:{
      object:"checkout.session",id:"cs_TEST",payment_link:link,livemode:true,
      amount_total:amount,currency:"gbp",payment_status:"paid",customer_details:{email:"sample@example.com"}
    }}};
  }
  const good=describeHostEvent(event("plink_1UaJtCAuxFu0m9QL1E6Bp2BH",9900));
  assert.match(good.subject,/payment received/);
  assert.match(good.text,/Starter website opening deposit/);
  assert.equal(describeHostEvent(event("plink_nonexistent",9900)),null);
  assert.equal(describeHostEvent(event("plink_1UaJtCAuxFu0m9QL1E6Bp2BH",10000)),null);
  assert.equal(describeHostEvent({...event("plink_1UaJtCAuxFu0m9QL1E6Bp2BH",9900),livemode:false}),null);
  assert.match(describeHostEvent(event("plink_1UaLa3AuxFu0m9QLOODhCsVG",1400)).text,/Starter website monthly maintenance/);
  assert.match(describeHostEvent(event("plink_1UaLa3AuxFu0m9QLOODhCsVG",1900)).text,/Starter website monthly maintenance/);
});

test("unconfigured Stripe notification endpoint fails closed without sending messages", async () => {
  const res=response();
  const req=Readable.from([]);
  req.method="POST";
  req.headers={};
  await stripeNotify(req,res);
  assert.equal(res.code,503);
});

test("production lead configuration requires all security settings", () => {
  const fixture={
    VERCEL_ENV:"production",HOST_SOLUTIONS_LEADS_ENABLED:"approved",
    HOST_SOLUTIONS_ORIGIN:"https://www.thepropertycareco.co.uk",
    HOST_SOLUTIONS_RESEND_KEY:"re_fixture_key_not_real",
    HOST_SOLUTIONS_FORM_SIGNING_SECRET:"a".repeat(64),
    HOST_SOLUTIONS_EMAIL_FROM:"PCCO Host Solutions <partners@thepropertycareco.co.uk>",
  };
  assert.equal(formConfigured(fixture),true);
  assert.equal(formConfigured({...fixture,HOST_SOLUTIONS_ORIGIN:"https://evil.example"}),false);
  assert.equal(formConfigured({...fixture,VERCEL_ENV:"preview"}),false);
  assert.equal(formConfigured({...fixture,HOST_SOLUTIONS_RESEND_KEY:undefined}),false);
});

test("signed customer enquiry delivers only to the verified PCCO inbox in mock", async () => {
  const originalFetch=global.fetch;
  const names=["VERCEL_ENV","HOST_SOLUTIONS_LEADS_ENABLED","HOST_SOLUTIONS_ORIGIN","HOST_SOLUTIONS_RESEND_KEY","HOST_SOLUTIONS_FORM_SIGNING_SECRET","HOST_SOLUTIONS_EMAIL_FROM"];
  const prior=Object.fromEntries(names.map(k=>[k,process.env[k]]));
  let sent=null;
  try {
    Object.assign(process.env,{
      VERCEL_ENV:"production",HOST_SOLUTIONS_LEADS_ENABLED:"approved",
      HOST_SOLUTIONS_ORIGIN:"https://www.thepropertycareco.co.uk",
      HOST_SOLUTIONS_RESEND_KEY:"re_fixture_key_not_real",
      HOST_SOLUTIONS_FORM_SIGNING_SECRET:"a".repeat(64),
      HOST_SOLUTIONS_EMAIL_FROM:"PCCO Host Solutions <partners@thepropertycareco.co.uk>",
    });
    global.fetch=async (url,options)=>{
      sent={url,options};
      return {ok:true,status:200,json:async()=>({id:"email_fixture"})};
    };
    const cookie=issueChallenge(process.env.HOST_SOLUTIONS_FORM_SIGNING_SECRET,Date.now()-2300,"b".repeat(32));
    const req={method:"POST",headers:{origin:process.env.HOST_SOLUTIONS_ORIGIN,cookie:"hs_form="+cookie},body:brief};
    const res=response();
    await consultation(req,res);
    assert.equal(res.code,200);
    assert.deepEqual(res.body,{received:true});
    assert.equal(sent.url,"https://api.resend.com/emails");
    const payload=JSON.parse(sent.options.body);
    assert.deepEqual(payload.to,["partners@thepropertycareco.co.uk"]);
    assert.equal(payload.reply_to,"test@example.com");
    assert.equal(sent.options.headers["Idempotency-Key"],"pcco-host-lead-"+"b".repeat(32));
    assert.equal(payload.text.includes("Marketing opt-in"),false);
  } finally {
    global.fetch=originalFetch;
    for(const [k,v] of Object.entries(prior))if(v===undefined)delete process.env[k];else process.env[k]=v;
  }
});

test("verified Stripe event sends one internal alert with provider idempotency", async () => {
  const priorEnv={
    enabled:process.env.HOST_SOLUTIONS_WEBHOOK_ENABLED,
    secret:process.env.HOST_SOLUTIONS_STRIPE_NOTIFY_SECRET,
    key:process.env.HOST_SOLUTIONS_RESEND_KEY,
    from:process.env.HOST_SOLUTIONS_EMAIL_FROM,
  };
  const originalFetch=global.fetch;
  const secret="whsec_test_fixture_not_real";
  const ts=Math.floor(Date.now()/1000);
  const body=Buffer.from(JSON.stringify({id:"evt_TESTALERT",object:"event",livemode:true,type:"checkout.session.completed",data:{object:{
    object:"checkout.session",id:"cs_TESTALERT",livemode:true,payment_link:"plink_1UaJtCAuxFu0m9QL1E6Bp2BH",currency:"gbp",amount_total:9900,payment_status:"paid",customer_details:{email:"sample@example.com"}
  }}}));
  const signature="t="+ts+",v1="+createHmac("sha256",secret).update(String(ts)+".").update(body).digest("hex");
  let send=null;
  try {
    process.env.HOST_SOLUTIONS_WEBHOOK_ENABLED="approved";
    process.env.HOST_SOLUTIONS_STRIPE_NOTIFY_SECRET=secret;
    process.env.HOST_SOLUTIONS_RESEND_KEY="re_fixture_key_not_real";
    process.env.HOST_SOLUTIONS_EMAIL_FROM="PCCO Host Solutions <partners@thepropertycareco.co.uk>";
    global.fetch=async (url,options)=>{send={url,options};return {ok:true};};
    const req=Readable.from([body]);
    req.method="POST";req.headers={"stripe-signature":signature};
    const res=response();
    await stripeNotify(req,res);
    assert.equal(res.code,200);
    const payload=JSON.parse(send.options.body);
    assert.deepEqual(payload.to,["partners@thepropertycareco.co.uk"]);
    assert.equal(payload.subject,"PCCO Host Solutions — payment received");
    assert.equal(send.options.headers["Idempotency-Key"],"pcco-host-stripe-evt_TESTALERT");
  } finally {
    global.fetch=originalFetch;
    const map={
      HOST_SOLUTIONS_WEBHOOK_ENABLED:priorEnv.enabled,
      HOST_SOLUTIONS_STRIPE_NOTIFY_SECRET:priorEnv.secret,
      HOST_SOLUTIONS_RESEND_KEY:priorEnv.key,
      HOST_SOLUTIONS_EMAIL_FROM:priorEnv.from,
    };
    for(const [k,v] of Object.entries(map))if(v===undefined)delete process.env[k];else process.env[k]=v;
  }
});
