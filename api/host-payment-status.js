import { json, redis } from "../lib/host-solutions/security.js";
import {
  stripeClient,
  paidHostSession,
} from "../lib/host-solutions/payments.js";
export default async function handler(req, res) {
  if (req.method !== "GET")
    return json(res, 405, { error: "Method not allowed" });
  const token = (req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("hs_checkout="))
    ?.slice(12);
  if (!token || !/^[a-f0-9-]{36}$/.test(token))
    return json(res, 401, { error: "Payment verification unavailable." });
  try {
    const id = await redis(["GET", `hs:session:${token}`]);
    if (!id) return json(res, 404, { error: "Session not found." });
    const session = await stripeClient().checkout.sessions.retrieve(id);
    if (!paidHostSession(session)) return json(res, 200, { paid: false });
    return json(res, 200, {
      paid: true,
      test: true,
      package: session.metadata.package,
      balancePence: Number(session.metadata.balance_pence),
      scopeConfirmed: false,
    });
  } catch {
    return json(res, 503, { error: "Unable to verify test payment." });
  }
}
