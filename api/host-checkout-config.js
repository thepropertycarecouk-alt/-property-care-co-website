import { json } from "../lib/host-solutions/security.js";
import { checkoutReady } from "../lib/host-solutions/payments.js";
export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed" });
  }
  try {
    checkoutReady();
    return json(res, 200, { enabled: true, depositPence: 9900, vatIncluded: true });
  } catch {
    return json(res, 200, { enabled: false, depositPence: 9900, vatIncluded: true });
  }
}
