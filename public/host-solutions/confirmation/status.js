try {
  const response = await fetch("/api/host-payment-status", {
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok || !data.paid) throw Error();
  document.getElementById("title").textContent =
    data.test ? "Test deposit verified." : "Your website deposit is verified.";
  document.getElementById("status").textContent = data.test
    ? "Your £99 test deposit is recorded, with no real charge. Our team will confirm the scope before any work starts."
    : "Your £99 website deposit has been verified. Our team will confirm the scope, remaining build balance and delivery schedule with you. Monthly maintenance has not started.";
  document.getElementById("onboarding").hidden = false;
} catch {
  document.getElementById("title").textContent = "Payment not verified.";
  document.getElementById("status").textContent =
    "We cannot verify a successful deposit for this browser. Please check your Stripe receipt and contact PCCO before retrying. This page alone does not confirm a payment.";
}
