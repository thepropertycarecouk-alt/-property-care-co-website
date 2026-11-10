// Public, independently verified live Stripe Payment Links.
// Each link is a £99 one-time website deposit, card only.
// Live checkout is on Stripe and it never starts a subscription.
export const depositLinks = Object.freeze({
  starter: "https://book.stripe.com/8x2cN4cfXgx05cp7md3VC00",
  direct: "https://book.stripe.com/8x28wO6VD5Sm20d7md3VC01",
  portfolio: "https://book.stripe.com/4gM3cu93L94ygV7dKB3VC02",
});

// Separate standard-price deposits become available on the website after 31 December 2026.
export const standardDepositLinks = Object.freeze({
  starter: "https://buy.stripe.com/00wdR86VD80u48lbCt3VC0d",
  direct: "https://buy.stripe.com/eVq28qcfX6WqfR3bCt3VC0e",
  portfolio: "https://buy.stripe.com/00w28q93L3Ke9sFgWN3VC0f",
});
export function depositLinkFor(packageId, promotional) {
  if (!["starter", "direct", "portfolio"].includes(packageId)) return null;
  return promotional ? depositLinks[packageId] : standardDepositLinks[packageId];
}
