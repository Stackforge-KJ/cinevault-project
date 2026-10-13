const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();
const PAYSTACK_SECRET = defineSecret("PAYSTACK_SECRET");

// The server's own price list (kobo). The browser's prices are only for display.
const PLANS = { basic: 250000, standard: 450000, premium: 650000 };
const DAYS = 30;

async function paystackVerify(reference, secret) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) throw new Error(`Paystack verify failed: ${res.status}`);
  return (await res.json()).data;
}

// Grants access only if Paystack says the payment succeeded, in NGN, for the right amount, and only once per reference.
async function activate(tx) {
  const meta = tx.metadata || {};
  const price = PLANS[meta.plan];
  if (tx.status !== "success" || tx.currency !== "NGN" || !price || tx.amount !== price || !meta.uid) return false;

  const payRef = db.collection("payments").doc(tx.reference);
  const userRef = db.collection("users").doc(meta.uid);
  return db.runTransaction(async (t) => {
    const [pay, user] = await Promise.all([t.get(payRef), t.get(userRef)]);
    if (pay.exists) return true; // already processed (popup and webhook can both arrive)
    if (!user.exists) return false;
    const current = user.data().expiresAt ? user.data().expiresAt.toMillis() : 0;
    const expiresAt = admin.firestore.Timestamp.fromMillis(Math.max(Date.now(), current) + DAYS * 864e5);
    t.set(payRef, {
      uid: meta.uid, plan: meta.plan, amount: tx.amount, currency: tx.currency,
      email: (tx.customer && tx.customer.email) || "", paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    t.update(userRef, { subscriptionStatus: "active", plan: meta.plan, expiresAt });
    return true;
  });
}

// Called by the browser right after the Paystack popup succeeds.
exports.verifyPayment = onCall({ secrets: [PAYSTACK_SECRET] }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Log in first.");
  const reference = req.data && req.data.reference;
  if (typeof reference !== "string" || !reference) throw new HttpsError("invalid-argument", "Missing reference.");
  const tx = await paystackVerify(reference, PAYSTACK_SECRET.value());
  if (!tx.metadata || tx.metadata.uid !== req.auth.uid) throw new HttpsError("permission-denied", "This payment belongs to another account.");
  if (!(await activate(tx))) throw new HttpsError("failed-precondition", "Payment was not successful.");
  return { ok: true };
});

// Paystack calls this itself, so a closed browser tab can never lose a paid subscription.
exports.paystackWebhook = onRequest({ secrets: [PAYSTACK_SECRET] }, async (req, res) => {
  const signature = crypto.createHmac("sha512", PAYSTACK_SECRET.value()).update(req.rawBody).digest("hex");
  if (signature !== req.get("x-paystack-signature")) { res.status(401).send("Bad signature"); return; }
  if (req.body.event === "charge.success") {
    try { await activate(req.body.data); } catch (e) { console.error(e); res.status(500).send("Error"); return; }
  }
  res.sendStatus(200);
});
