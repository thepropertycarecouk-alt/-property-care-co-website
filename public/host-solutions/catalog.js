// Shared, exact-pence commercial catalogue. Terms require owner approval before sale.
export const deadline = "2026-12-31T23:59:59.999Z";
export const packages = [
  {
    id: "starter",
    name: "Starter",
    tag: "A confident first impression.",
    description:
      "A polished home for your properties, with a simple route from browsing to enquiry.",
    build: 39900,
    offer: 29925,
    monthly: 1900,
    promoMonthly: 1400,
    properties: 5,
    features: [
      "Up to 5 property listings",
      "Branded, mobile-friendly website",
      "Photos, amenities & descriptions",
      "Contact forms & WhatsApp links",
      "Basic SEO & analytics",
      "Secure hosting, SSL & handover",
      "14-day AI trial · no automatic charges",
    ],
  },
  {
    id: "direct",
    name: "Direct Booking",
    tag: "Built for your next chapter.",
    description:
      "Make it easier for contractors, companies and returning guests to enquire directly.",
    build: 65000,
    offer: 48750,
    monthly: 3900,
    promoMonthly: 3400,
    properties: 5,
    features: [
      "Everything in Starter, plus",
      "5 professionally designed property pages",
      "Enhanced galleries, search & filtering",
      "Contractor & corporate enquiry journeys",
      "Supported booking-engine integration",
      "Guest guide & location-focused SEO",
      "Search Console, launch consultation & training",
    ],
  },
  {
    id: "portfolio",
    name: "Portfolio Pro",
    tag: "More properties. One clear experience.",
    description:
      "A connected digital presence for established operators with more complex guest requirements.",
    build: 99500,
    offer: 74625,
    monthly: 5500,
    promoMonthly: 5000,
    properties: 10,
    features: [
      "Everything in Direct Booking, plus",
      "Up to 10 property listings",
      "Multiple location & audience landing pages",
      "Group & multi-property enquiry forms",
      "Standard AI booking assistant included",
      "Enhanced tracking & SEO foundations",
      "Priority support & agreed content updates",
    ],
  },
];
export const money = (p) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: p % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(p / 100);
export function priceFor(id, now = new Date()) {
  const p = packages.find((x) => x.id === id);
  if (!p) throw new Error("Unknown package");
  const promo = now.getTime() <= Date.parse(deadline);
  return {
    ...p,
    promo,
    total: promo ? p.offer : p.build,
    maintenance: promo ? p.promoMonthly : p.monthly,
    deposit: 9900,
    balance: (promo ? p.offer : p.build) - 9900,
  };
}
export const launchTerms = {
  vatApproved: false,
  monthlyTermApproved: false,
  paymentPolicyApproved: false,
  fairUseApproved: false,
};
