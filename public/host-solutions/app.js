import { packages, priceFor, money } from "./catalog.js";
const $ = (s) => document.querySelector(s);
const prices = packages.map((p) => priceFor(p.id));
$("#pricing").innerHTML = prices
  .map(
    (p, i) =>
      `<article class="price-card ${i === 1 ? "recommended" : ""}">${i === 1 ? '<span class="badge">RECOMMENDED</span>' : ""}<h3>${p.name}</h3><p class="tag">${p.tag}</p><div class="price-line">${p.promo ? `<del>${money(p.build)}</del>` : ""}<strong>${money(p.total)}</strong></div>${p.promo ? `<p class="save">You save ${money(p.build - p.total)} · 25%</p>` : ""}<p class="oneoff">One-off website build · VAT included</p><div class="monthly">${p.promo ? `<del>${money(p.monthly)}</del>` : ""}<strong>${money(p.maintenance)}</strong> / month<small>Website maintenance · VAT included · ${p.promo ? "introductory term awaiting approval" : "standard rate"}</small>${p.promo ? '<span class="monthly-saving">You save £5/month · promotional duration to be confirmed</span>' : ""}</div><ul class="checklist">${p.features.map((f) => `<li>${f}</li>`).join("")}</ul>${i === 1 ? '<p class="fine">Optional AI: £75 setup + £10/month.<br>No automatic charge after the trial.</p>' : i === 2 ? '<p class="fine">Standard AI included.<br>Fair-use allowance agreed before purchase.</p>' : '<p class="fine">AI trial expires without charges.<br>Paid continuation is optional.</p>'}<button class="btn" type="button" data-checkout="${p.id}">Pay £99 Deposit</button><a class="btn secondary" href="#consultation">Talk to Us First</a><p class="balance">Then ${money(p.balance)} remaining on your build.</p></article>`,
  )
  .join("");
if (!prices[0].promo) {
  $("#offer-banner").innerHTML =
    "<div><b>Choose your website package.</b><span>The opening offer ended on 31 December 2026. Standard pricing is shown below.</span></div>";
}
const groups = [
  [
    "Your properties",
    [
      [
        "Property listings",
        ["Up to 5", "Up to 5", "Up to 10"],
        "The agreed property count includes supplied photos, descriptions and amenities. Additional listings are quoted separately.",
      ],
      [
        "Property presentation",
        [
          "Branded listings",
          "Designed pages + galleries",
          "Advanced presentation",
        ],
        "Direct Booking includes up to five professionally designed property pages and enhanced galleries. Portfolio Pro extends the presentation across a larger portfolio.",
      ],
      [
        "Mobile design, hosting & SSL",
        ["Included", "Included", "Included"],
        "Responsive accommodation pages with secure hosting and SSL under the maintenance agreement.",
      ],
      [
        "Property search & filters",
        ["Not included", "Included", "Included"],
        "Help guests narrow the property selection by useful published attributes. This is not a live availability guarantee.",
      ],
    ],
  ],
  [
    "Enquiries & booking",
    [
      [
        "Contact forms & WhatsApp links",
        ["Included", "Included", "Included"],
        "A direct route to your team. WhatsApp links do not include automated WhatsApp messaging.",
      ],
      [
        "Contractor & corporate journeys",
        ["General enquiry", "Tailored journeys", "Dedicated landing pages"],
        "Capture relevant stay requirements such as dates, guests, beds and parking. Portfolio Pro adds audience-specific landing pages.",
      ],
      [
        "Group & multi-property handling",
        ["Not included", "Not included", "Included"],
        "Structured enquiries for groups needing several properties; your team confirms suitable options.",
      ],
      [
        "Booking engine / channel manager",
        ["Not included", "Supported standard setup", "Setup assistance"],
        "Existing supported embed, link or connector only. We verify compatibility before promising an integration. Software subscriptions and custom APIs are separate.",
      ],
      [
        "Enquiry notifications",
        [
          "Contact notifications",
          "Booking enquiry notifications",
          "Email + enhanced tracking",
        ],
        "Receive useful enquiry information. Portfolio Pro includes enhanced enquiry tracking within the agreed tools and scope.",
      ],
      [
        "Guest information & digital guide",
        [
          "Property essentials",
          "Guest pages + guide",
          "Professional guest sections",
        ],
        "Share useful stay information to reduce repeat questions. Private access arrangements are agreed separately.",
      ],
      [
        "Dynamic pricing integration",
        ["Not included", "Not included", "Assistance included"],
        "Advice and supported setup assistance for your chosen pricing tool. Third-party fees and bespoke development are excluded.",
      ],
    ],
  ],
  [
    "Search & measurement",
    [
      [
        "SEO foundations",
        ["Basic", "Location-focused", "Advanced foundations"],
        "Descriptive page structure, titles and search basics. No ranking guarantee. Portfolio Pro adds appropriate individual property structured data.",
      ],
      [
        "Location pages",
        [
          "Not included",
          "Location-focused structure",
          "Multiple location pages",
        ],
        "Help guests understand where you operate. Page counts and content are defined in the project brief.",
      ],
      [
        "Analytics",
        ["Basic setup", "Basic setup", "Enhanced enquiry tracking"],
        "Google Analytics or an agreed equivalent, with appropriate privacy and consent configuration.",
      ],
      [
        "Google Search Console",
        ["Not included", "Setup included", "Setup included"],
        "Verify your site and configure search monitoring using authorised access.",
      ],
    ],
  ],
  [
    "AI, onboarding & support",
    [
      [
        "AI booking assistant",
        ["14-day trial", "14-day trial", "Standard AI included"],
        "Trials expire without automatic charges. Portfolio Pro AI is included with an agreed, published fair-use allowance.",
      ],
      [
        "Optional paid AI",
        ["£150 + £20/month", "£75 + £10/month", "No separate standard fee"],
        "Starter can select the standalone service. Paid continuation requires explicit agreement; no offer discount applies to AI.",
      ],
      [
        "AI property recommendations",
        [
          "Paid service where supported",
          "Paid add-on where supported",
          "Included where supported",
        ],
        "Recommendations use accessible published listing data. Availability, final rates and bookings require operator confirmation.",
      ],
      [
        "AI lead capture & qualification",
        ["Paid service", "Paid add-on", "Included"],
        "Capture guest requirements and contact information, then hand over to the operator. Monthly conversation limits must be approved.",
      ],
      [
        "Consultation & handover",
        [
          "Onboarding + handover",
          "Launch consultation + training",
          "Implementation + full training",
        ],
        "Agree your requirements before build, then learn how to use the delivered experience.",
      ],
      [
        "Support",
        ["Standard", "Standard", "Priority"],
        "Contact channels, hours and response targets will be specified in your agreement. No unapproved response-time promise.",
      ],
      [
        "Content maintenance allowance",
        ["By agreement", "By agreement", "Agreed allowance included"],
        "Exact monthly allowances and exclusions require owner approval and will be written into the scope.",
      ],
    ],
  ],
];
const valueClass = (v) =>
  v !== "Not included" && (v === "Included" || v.includes("included"))
    ? "included"
    : v.includes("£") || v.includes("Paid")
      ? "optional"
      : "";
$("#comparison tbody").innerHTML = groups
  .map(
    ([g, rows]) =>
      `<tr class="group"><th colspan="4" scope="colgroup">${g}</th></tr>${rows.map(([title, values, explain]) => `<tr><th scope="row"><details><summary>${title}</summary><p>${explain}</p></details></th>${values.map((v) => `<td class="${valueClass(v)}">${v}</td>`).join("")}</tr>`).join("")}`,
  )
  .join("");
function mobileCompare() {
  const i = Number($("#compare-package").value);
  $("#mobile-features").innerHTML = groups
    .map(
      ([g, rows]) =>
        `<h3 style="font-size:17px;margin-top:28px">${g}</h3>${rows.map(([title, values, explain]) => `<div class="mobile-row"><details><summary>${title}</summary><p>${explain}</p></details><strong class="${valueClass(values[i])}">${values[i]}</strong></div>`).join("")}`,
    )
    .join("");
}
$("#compare-package").addEventListener("change", mobileCompare);
mobileCompare();
const dialog = $("#checkout-dialog");
let opener;
document.querySelectorAll("[data-checkout]").forEach((b) =>
  b.addEventListener("click", () => {
    opener = b;
    const p = priceFor(b.dataset.checkout);
    $("#checkout-title").textContent = p.name;
    $("#checkout-breakdown").innerHTML = [
      ["Website build · one-off", money(p.total)],
      ["Deposit today (when checkout opens)", money(p.deposit)],
      ["Remaining build balance", money(p.balance)],
      ["Maintenance · separately authorised", money(p.maintenance) + "/month"],
      [
        "Optional AI",
        p.id === "direct"
          ? "£75 setup + £10/month"
          : p.id === "portfolio"
            ? "Standard AI included"
            : "£150 setup + £20/month",
      ],
      ["Website price and deposit VAT", "Included — no VAT added"],
    ]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
      .join("");
    dialog.showModal();
  }),
);
$("#close-checkout").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => opener?.focus());
$("#checkout-consult").addEventListener("click", () => {
  dialog.close();
  location.hash = "consultation";
  $("#consult-form [name=service]").value = "New website";
  $("#consult-form [name=business]").focus();
});
// Safe, deterministic demonstration. No fetch, API usage, personal data or claims of live availability.
const demo = {
  contractor: [
    "We need accommodation for a team.",
    "Of course. A useful enquiry includes your worksite, dates, number of guests, separate-bed requirements and van parking. Shall I show an example?",
    "Show an example",
    "Example only: a team of four, a four-week stay and two vans. The assistant can gather these requirements and pass them to your team. Any property match, rate and availability still need confirmation.",
  ],
  family: [
    "We are visiting family.",
    "I can help capture your dates, guest numbers, preferred area and accessibility requirements. Would you like to see the handover?",
    "Show the handover",
    "Example handover: two adults seeking a one-week stay near family, with parking. On a live installation, the guest explicitly supplies their contact details for an operator response. Nothing is sent in this demo.",
  ],
  question: [
    "Is parking available?",
    "A configured assistant can answer using the property information you approve. If parking details are missing or uncertain, it should ask your team rather than guess.",
    "What happens next?",
    "It can collect a question and request an operator response. Private access codes, unverified availability and unsupported promises are not part of this demo.",
  ],
};
function bubble(text, user = false) {
  const d = document.createElement("div");
  d.className = "bubble" + (user ? " user" : "");
  d.textContent = text;
  $("#chat-log").append(d);
  $("#chat-log").scrollTop = $("#chat-log").scrollHeight;
}
function resetDemo() {
  $("#chat-log").replaceChildren();
  bubble("Welcome! Choose a scenario to explore the enquiry journey.");
  $("#chat-options").innerHTML =
    '<button type="button" data-demo="contractor">A contractor team</button><button type="button" data-demo="family">A family stay</button><button type="button" data-demo="question">A guest question</button>';
}
$("#chat-options").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.demo) {
    const key = b.dataset.demo,
      d = demo[key];
    bubble(d[0], true);
    bubble(d[1]);
    $("#chat-options").innerHTML =
      `<button type="button" data-follow="${key}">${d[2]}</button><button type="button" data-reset>Restart</button>`;
  } else if (b.dataset.follow) {
    const d = demo[b.dataset.follow];
    bubble(d[2], true);
    bubble(d[3]);
    $("#chat-options").innerHTML =
      '<button type="button" data-reset>Try another scenario</button>';
  } else resetDemo();
});
// Progressive form extends the prototype: explicit integrations, full review and non-delivering confirmation.
const form = $("#consult-form"),
  steps = [...form.querySelectorAll("[data-step]")];
let step = 0;
const labels = {
  business: "Host / company",
  properties: "Properties",
  audience: "Main audience",
  website: "Website / listing",
  service: "Service",
  style: "Design style",
  colours: "Brand colours",
  goals: "Goals",
  integrations: "Integrations",
  notes: "Other information",
  name: "Contact name",
  email: "Email",
  phone: "Telephone / WhatsApp",
  contact: "Preferred contact",
};
function error(message, input) {
  $("#form-error").hidden = false;
  $("#form-error").textContent = message;
  if (input) {
    input.setAttribute("aria-invalid", "true");
    input.focus();
  }
  return false;
}
function validate(index) {
  $("#form-error").hidden = true;
  form
    .querySelectorAll("[aria-invalid]")
    .forEach((e) => e.removeAttribute("aria-invalid"));
  for (const el of steps[index].querySelectorAll("input,select,textarea")) {
    if (
      (el.required && el.type !== "checkbox" && !el.value.trim()) ||
      !el.checkValidity()
    )
      return error(
        "Please complete or correct " +
          (labels[el.name] || "the consent checkbox") +
          ".",
        el,
      );
  }
  if (index === 0 && form.elements.website.value) {
    try {
      if (
        !["https:", "http:"].includes(
          new URL(form.elements.website.value).protocol,
        )
      )
        throw Error();
    } catch {
      return error(
        "Please use a valid http or https website address.",
        form.elements.website,
      );
    }
  }
  if (
    index === 2 &&
    (!/^\+?[\d\s().-]{7,30}$/.test(form.elements.phone.value) ||
      form.elements.phone.value.replace(/\D/g, "").length < 7 ||
      form.elements.phone.value.replace(/\D/g, "").length > 15)
  )
    return error("Please enter a valid telephone number.", form.elements.phone);
  return true;
}
function showStep(n) {
  step = n;
  steps.forEach((el, i) => (el.hidden = i !== n));
  $("#step-label").textContent = `Step ${n + 1} of 4`;
  $("#progress-bar").style.width = `${(n + 1) * 25}%`;
  $("#form-error").hidden = true;
  steps[n].querySelector("h3").focus();
}
function review() {
  const dl = $("#brief-review");
  dl.replaceChildren();
  for (const [name, label] of Object.entries(labels)) {
    const row = document.createElement("div"),
      dt = document.createElement("dt"),
      dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = form.elements[name].value || "Not supplied";
    row.append(dt, dd);
    dl.append(row);
  }
}
form.querySelectorAll("[data-next]").forEach((b) =>
  b.addEventListener("click", () => {
    if (validate(step)) {
      if (step === 2) review();
      showStep(step + 1);
    }
  }),
);
form
  .querySelectorAll("[data-back]")
  .forEach((b) => b.addEventListener("click", () => showStep(step - 1)));
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (step < 3) {
    if (validate(step)) {
      if (step === 2) review();
      showStep(step + 1);
    }
    return;
  }
  for (let i = 0; i < 3; i++) {
    if (!validate(i)) {
      showStep(i);
      validate(i);
      return;
    }
  }
  if (form.elements.company_fax.value)
    return error("Please reload and try again.");
  form.hidden = true;
  $("#form-success").hidden = false;
  $("#step-label").textContent = "Preview complete";
  $("#form-success").focus();
});
$("#restart-brief").addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  $("#form-success").hidden = true;
  showStep(0);
});
const aiDialog = $("#ai-review-dialog");
let aiOpener;
$("#ai-review-open").addEventListener("click", (event) => {
  aiOpener = event.currentTarget;
  aiDialog.showModal();
});
$("#close-ai-review").addEventListener("click", () => aiDialog.close());
aiDialog.addEventListener("close", () => aiOpener?.focus());
$("#ai-review-consult").addEventListener("click", () => {
  aiDialog.close();
  location.hash = "consultation";
  form.hidden = false;
  $("#form-success").hidden = true;
  form.elements.service.value = "Standalone AI assistant";
  showStep(0);
  form.elements.business.focus();
});
document.querySelectorAll("[data-interest]").forEach((a) =>
  a.addEventListener("click", () => {
    form.hidden = false;
    $("#form-success").hidden = true;
    form.elements.service.value = a.dataset.interest;
    showStep(0);
  }),
);
