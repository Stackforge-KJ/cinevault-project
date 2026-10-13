import { renderHeader, esc } from "../ui.js";
import { configured, db } from "../firebase.js";
import { requireAuth } from "../auth.js";
import { library } from "../library.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

renderHeader("");
const main = document.getElementById("main");
const naira = (n) => "\u20A6" + Math.round(n).toLocaleString("en-NG");
const short = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const full = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

if (!configured) {
  main.innerHTML = `<p class="msg">Firebase is not set up yet.</p>`;
} else {
  const me = await requireAuth();
  if (me.role !== "admin") {
    main.innerHTML = `<h1 class="page-title">Admin only</h1><p class="empty">This page is for the site owner. <a href="index.html" style="color:var(--accent)">Back to home</a></p>`;
  } else {
    try {
      const [uSnap, pSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(1000))),
        getDocs(query(collection(db, "payments"), orderBy("paidAt", "desc"), limit(1000))),
      ]);
      render(uSnap.docs.map((d) => ({ id: d.id, ...d.data() })), pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      main.innerHTML = `<p class="msg">Could not load the data. Publish the updated Firestore rules and check that your account has the admin role.</p>`;
    }
  }
}

function render(users, pays) {
  const now = Date.now();
  const active = users.filter((u) => u.subscriptionStatus === "active" && u.expiresAt && u.expiresAt.toMillis() > now);
  const revenue = pays.reduce((sum, p) => sum + (p.amount || 0) / 100, 0);

  const card = (label, value) => `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`;
  const payRows = pays.slice(0, 10).map((p) => `<tr><td>${p.paidAt ? full(p.paidAt.toDate()) : "-"}</td><td>${esc(p.email)}</td><td>${esc(p.plan)}</td><td>${naira((p.amount || 0) / 100)}</td></tr>`).join("");
  const userRows = users.slice(0, 10).map((u) => {
    const sub = u.subscriptionStatus === "active" && u.expiresAt && u.expiresAt.toMillis() > now;
    return `<tr><td>${esc(u.username)}${u.role === "admin" ? " (admin)" : ""}</td><td>${esc(u.email)}</td><td>${sub ? "Subscriber" : "Free"}</td><td>${sub ? full(u.expiresAt.toDate()) : "-"}</td></tr>`;
  }).join("");

  main.innerHTML = `
    <h1 class="page-title">Dashboard</h1>
    <div class="stat-cards">
      ${card("Total users", users.length)}
      ${card("Active subscribers", active.length)}
      ${card("Total revenue", naira(revenue))}
      ${card("Full films in library", library.length)}
    </div>
    <section class="panel">
      <div class="section-head"><h2>Revenue</h2>
        <select class="field" id="range" aria-label="Date range"><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></div>
      <div class="chart" id="chart"></div>
    </section>
    <section class="panel"><h2>Recent payments</h2>
      <div class="table-wrap"><table class="data"><thead><tr><th>Date</th><th>Email</th><th>Plan</th><th>Amount</th></tr></thead>
      <tbody>${payRows || `<tr><td colspan="4">No payments yet.</td></tr>`}</tbody></table></div></section>
    <section class="panel"><h2>Newest users</h2>
      <div class="table-wrap"><table class="data"><thead><tr><th>Username</th><th>Email</th><th>Status</th><th>Subscribed until</th></tr></thead>
      <tbody>${userRows || `<tr><td colspan="4">No users yet.</td></tr>`}</tbody></table></div></section>`;

  const chartEl = document.getElementById("chart");
  const draw = (days) => (chartEl.innerHTML = chart(pays, days));
  document.getElementById("range").addEventListener("change", (e) => draw(+e.target.value));
  draw(7);
}

// Revenue per day as an SVG bar chart (no library needed)
function chart(pays, days) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) { const d = new Date(today); d.setDate(d.getDate() - i); buckets.push({ d, total: 0 }); }
  for (const p of pays) {
    if (!p.paidAt) continue;
    const t = p.paidAt.toDate();
    t.setHours(0, 0, 0, 0);
    const b = buckets.find((x) => x.d.getTime() === t.getTime());
    if (b) b.total += (p.amount || 0) / 100;
  }
  const max = Math.max(...buckets.map((b) => b.total), 1);
  const W = 600, H = 220, pad = 8, top = 18, bottom = 24;
  const bw = (W - pad * 2) / buckets.length;
  const step = Math.ceil(days / 7);
  const bars = buckets.map((b, i) => {
    const h = ((H - top - bottom) * b.total) / max;
    const x = pad + i * bw;
    return `<rect x="${x + bw * 0.15}" y="${H - bottom - h}" width="${bw * 0.7}" height="${b.total ? Math.max(h, 2) : 0}" rx="3" fill="var(--accent)"><title>${short(b.d)}: ${naira(b.total)}</title></rect>`
      + (i % step === 0 ? `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="var(--muted)">${short(b.d)}</text>` : "");
  }).join("");
  const total = buckets.reduce((s, b) => s + b.total, 0);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue per day for the last ${days} days: ${naira(total)} in total">
    <text x="${pad}" y="12" font-size="11" fill="var(--muted)">${naira(max)}</text>
    <line x1="${pad}" x2="${W - pad}" y1="${H - bottom}" y2="${H - bottom}" stroke="var(--line)"/>${bars}</svg>`;
}
