import { renderHeader } from "../ui.js";
import { configured, app } from "../firebase.js";
import { requireAuth } from "../auth.js";
import { PAYSTACK_PUBLIC_KEY, FUNCTIONS_REGION } from "../payments-config.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";

// Display only: the server has its own price list and is the one that decides what a payment is worth.
const PLANS = [
  { id: "basic", name: "Basic", price: 2500, perks: ["Watch on 1 device", "Standard quality", "Full film library"] },
  { id: "standard", name: "Standard", price: 4500, pop: true, perks: ["Watch on 2 devices", "Full HD quality", "Full film library", "Downloads"] },
  { id: "premium", name: "Premium", price: 6500, perks: ["Watch on 4 devices", "Ultra HD quality", "Full film library", "Downloads"] },
];

renderHeader("");
const main = document.getElementById("main");

if (!configured) {
  main.innerHTML = `<p class="msg">Firebase is not set up yet. Paste your config into js/firebase-config.js.</p>`;
} else {
  const user = await requireAuth();
  const naira = (n) => "\u20A6" + n.toLocaleString("en-NG");
  const until = user.isSubscribed ? new Date(user.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  main.innerHTML = `
    <h1 class="page-title">Choose your plan</h1>
    <p class="hint">${user.isSubscribed ? `You are subscribed until ${until}. Paying again extends it by 30 days.` : "Unlock full films and downloads. Each payment covers 30 days."}</p>
    <p class="hint">Test mode: pay with Paystack's test cards, no real money moves.</p>
    <div class="plans">${PLANS.map((p) => `
      <article class="plan${p.pop ? " pop" : ""}">
        ${p.pop ? `<span class="badge on">Most popular</span>` : ""}
        <h2>${p.name}</h2>
        <p class="price">${naira(p.price)}<small> / month</small></p>
        <ul>${p.perks.map((x) => `<li>${x}</li>`).join("")}</ul>
        <button class="btn ${p.pop ? "btn-primary" : "btn-ghost"} btn-block" data-plan="${p.id}">${user.isSubscribed ? "Renew" : "Subscribe"}</button>
      </article>`).join("")}</div>
    <p class="hint" style="margin-top:1rem">All plans currently unlock the same film library. Device and quality limits are shown for design only.</p>
    <p class="error" id="msg" role="status" style="margin-top:1rem"></p>`;
  const msg = document.getElementById("msg");
  const say = (t, bad = true) => { msg.style.color = bad ? "" : "var(--muted)"; msg.textContent = t; };

  async function confirmPayment(reference) {
    say("Confirming your payment...", false);
    try {
      await httpsCallable(getFunctions(app, FUNCTIONS_REGION), "verifyPayment")({ reference });
      say("Payment confirmed. You are subscribed!", false);
      setTimeout(() => (location.href = "index.html"), 1500);
    } catch (e) {
      console.error(e);
      say("We could not confirm your payment yet. If you were charged, it will activate within a minute. Refresh this page to check.");
    }
  }

  main.addEventListener("click", (e) => {
    const b = e.target.closest("[data-plan]");
    if (!b) return;
    if (PAYSTACK_PUBLIC_KEY.includes("PASTE") || !window.PaystackPop) { say("Paystack is not ready. Add your public key in js/payments-config.js."); return; }
    const plan = PLANS.find((p) => p.id === b.dataset.plan);
    say("");
    PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: plan.price * 100, // kobo
      currency: "NGN",
      ref: `cv-${user.uid.slice(0, 8)}-${Date.now()}`,
      metadata: { uid: user.uid, plan: plan.id },
      callback: function (res) { confirmPayment(res.reference); }, // Paystack needs a plain function here
      onClose: function () { say("Payment window closed. You have not been charged."); },
    }).openIframe();
  });
}
