import { json } from "../lib/host-solutions/security.js";
import { formConfigured, issueChallenge } from "../lib/host-solutions/form-challenge.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed" });
  }
  const enabled = formConfigured();
  if (!enabled) return json(res, 200, { enabled: false });
  const token = issueChallenge(process.env.HOST_SOLUTIONS_FORM_SIGNING_SECRET);
  res.setHeader("Set-Cookie", "hs_form=" + token + "; Path=/api/host-consultation; Max-Age=1800; Secure; HttpOnly; SameSite=Strict");
  return json(res, 200, { enabled: true });
}
