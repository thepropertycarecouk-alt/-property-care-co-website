import { createHash } from "node:crypto";
export function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(status).json(body);
}
export function requireOrigin(req, env = process.env) {
  const origin = env.HOST_SOLUTIONS_ORIGIN;
  if (
    !origin ||
    !origin.startsWith("https://") ||
    req.headers.origin !== origin
  )
    throw Error("Untrusted origin");
  return origin;
}
export function testKey(env = process.env) {
  const key = env.HOST_SOLUTIONS_STRIPE_TEST_KEY;
  if (!key || !/^(rk|sk)_test_/.test(key) || env.VERCEL_ENV === "production")
    throw Error("Test configuration unavailable");
  return key;
}
export function liveKey(env = process.env) {
  const key = env.HOST_SOLUTIONS_STRIPE_LIVE_KEY;
  if (env.VERCEL_ENV !== "production" || !key || !/^(rk|sk)_live_/.test(key))
    throw Error("Live Stripe configuration unavailable");
  return key;
}
export function paymentMode(env = process.env) {
  return env.VERCEL_ENV === "production" ? "live" : "test";
}
export function parseBody(req) {
  const raw =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  if (Buffer.byteLength(raw) > 12000) throw Error("Request too large");
  const data = JSON.parse(raw);
  if (!data || Array.isArray(data) || typeof data !== "object")
    throw Error("Invalid body");
  return data;
}
export function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}
// Dedicated preview Redis REST database. Never use process memory for payment records.
export async function redis(command, env = process.env) {
  const url = env.HOST_SOLUTIONS_REDIS_URL,
    token = env.HOST_SOLUTIONS_REDIS_TOKEN;
  if (!url?.startsWith("https://") || !token)
    throw Error("Storage unavailable");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw Error("Storage unavailable");
  const result = await response.json();
  if (result.error) throw Error("Storage unavailable");
  return result.result;
}
export async function rateLimit(req, prefix) {
  const ip = req.headers["x-real-ip"] || "unknown";
  const bucket = Math.floor(Date.now() / 60000);
  const key = `hs:rate:${prefix}:${hash(String(ip))}:${bucket}`;
  const count = await redis(["INCR", key]);
  if (count === 1) await redis(["EXPIRE", key, 120]);
  if (count > 10) throw Error("Too many requests");
}
