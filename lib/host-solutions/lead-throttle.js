import { createHmac } from "node:crypto";

const EXPECTED_PROJECT = "https://pgbwbklqvyyzipbxcdvx.supabase.co";
const RPC = "/rest/v1/rpc/pcco_hs_form_throttle";
const strictHex = (x, len) => typeof x === "string" && new RegExp("^[a-f0-9]{" + len + "}$").test(x);

export async function consumeLeadNonce(req, nonce, env = process.env) {
  const secret = env.HOST_SOLUTIONS_RATE_LIMIT_SECRET;
  const apiKey = env.HOST_SOLUTIONS_SUPABASE_ANON_KEY;
  if (env.HOST_SOLUTIONS_SUPABASE_URL !== EXPECTED_PROJECT ||
      !strictHex(secret, 64) ||
      !/^eyJ[A-Za-z0-9_.-]{100,}$/.test(apiKey || "") ||
      !strictHex(nonce, 32)) throw Error("Rate limiter unavailable");

  // Vercel supplies x-real-ip. Never use an address from visitor form data.
  // If the trusted header is missing, fail closed with a manual-email fallback.
  const remote = req.headers["x-real-ip"] || req.headers["x-vercel-forwarded-for"];
  const ip = String(remote || "").split(",")[0].trim();
  if (!/^[A-Fa-f0-9:.]{3,45}$/.test(ip)) throw Error("Trusted visitor address unavailable");

  const keyed = (value) => createHmac("sha256", secret).update(value).digest("hex");
  const response = await fetch(EXPECTED_PROJECT + RPC, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      p_secret: secret,
      p_requester_hash: keyed(ip),
      p_nonce_hash: keyed(nonce),
    }),
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw Error("Rate limiter unavailable");
  const allowed = await response.json();
  if (typeof allowed !== "boolean") throw Error("Invalid rate limiter response");
  return allowed;
}
