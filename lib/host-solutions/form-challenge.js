import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const MAX_AGE = 30 * 60 * 1000;
const MIN_AGE = 1800;

export function formConfigured(env = process.env) {
  return env.VERCEL_ENV === "production" &&
    env.HOST_SOLUTIONS_LEADS_ENABLED === "approved" &&
    env.HOST_SOLUTIONS_ORIGIN === "https://www.thepropertycareco.co.uk" &&
    /^re_[A-Za-z0-9_]+$/.test(env.HOST_SOLUTIONS_RESEND_KEY || "") &&
    /^[a-f0-9]{64}$/.test(env.HOST_SOLUTIONS_FORM_SIGNING_SECRET || "") &&
    /^[a-f0-9]{64}$/.test(env.HOST_SOLUTIONS_RATE_LIMIT_SECRET || "") &&
    env.HOST_SOLUTIONS_SUPABASE_URL === "https://pgbwbklqvyyzipbxcdvx.supabase.co" &&
    /^eyJ[A-Za-z0-9_.-]{100,}$/.test(env.HOST_SOLUTIONS_SUPABASE_ANON_KEY || "") &&
    env.HOST_SOLUTIONS_EMAIL_FROM === "PCCO Host Solutions <partners@thepropertycareco.co.uk>";
}

function mac(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function issueChallenge(secret, now = Date.now(), nonce = randomBytes(16).toString("hex")) {
  if (!/^[a-f0-9]{64}$/.test(secret || "") || !/^[a-f0-9]{32}$/.test(nonce))
    throw Error("Invalid challenge configuration");
  const payload = String(now) + "." + nonce;
  return payload + "." + mac(payload, secret);
}

export function verifyChallenge(value, secret, now = Date.now()) {
  if (typeof value !== "string") throw Error("Challenge missing");
  const match = /^(\d{13})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(value);
  if (!match || !/^[a-f0-9]{64}$/.test(secret || "")) throw Error("Challenge invalid");
  const age = now - Number(match[1]);
  if (!Number.isSafeInteger(age) || age < MIN_AGE || age > MAX_AGE)
    throw Error("Challenge expired or too recent");
  const expected = Buffer.from(mac(match[1] + "." + match[2], secret), "hex");
  const received = Buffer.from(match[3], "hex");
  if (!timingSafeEqual(expected, received)) throw Error("Challenge signature invalid");
  return { nonce: match[2] };
}

export function readCookie(raw, key) {
  const item = String(raw || "").split(";").map(x => x.trim())
    .find(x => x.startsWith(key + "="));
  return item ? item.slice(key.length + 1) : "";
}
