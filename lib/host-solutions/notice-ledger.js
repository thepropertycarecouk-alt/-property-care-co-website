import { createHmac } from "node:crypto";

const HOST_PROJECT = "https://pgbwbklqvyyzipbxcdvx.supabase.co";
const VALID_API_KEY = /^eyJ[A-Za-z0-9_.-]{100,}$/;

async function callLedger(method, eventHash, env) {
  const secret = env.HOST_SOLUTIONS_RATE_LIMIT_SECRET;
  const key = env.HOST_SOLUTIONS_SUPABASE_ANON_KEY;
  if (env.HOST_SOLUTIONS_SUPABASE_URL !== HOST_PROJECT ||
      !/^[a-f0-9]{64}$/.test(secret || "") ||
      !VALID_API_KEY.test(key || "") ||
      !/^[a-f0-9]{64}$/.test(eventHash || ""))
    throw Error("Payment-notification ledger unavailable");

  const response = await fetch(HOST_PROJECT + "/rest/v1/rpc/" + method, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({p_secret:secret,p_event_hash:eventHash}),
    signal: AbortSignal.timeout(6500),
  });
  if (!response.ok) throw Error("Payment-notification ledger unavailable");
  return await response.json();
}

export async function claimStripeAlert(eventId, env = process.env) {
  if (!/^evt_[A-Za-z0-9]+$/.test(eventId || ""))
    throw Error("Invalid Stripe event identifier");
  const secret = env.HOST_SOLUTIONS_RATE_LIMIT_SECRET;
  if (!/^[a-f0-9]{64}$/.test(secret || ""))
    throw Error("Payment-notification ledger unavailable");
  const hash = createHmac("sha256",secret).update(eventId).digest("hex");
  const state = await callLedger("pcco_hs_event_claim",hash,env);
  if (!["claimed","done","busy"].includes(state))
    throw Error("Invalid payment-notification ledger state");
  return {hash,state};
}

export async function markStripeAlertDelivered(eventHash, env = process.env) {
  if (await callLedger("pcco_hs_event_mark_delivered",eventHash,env) !== true)
    throw Error("Unable to confirm payment-notification ledger delivery");
}
