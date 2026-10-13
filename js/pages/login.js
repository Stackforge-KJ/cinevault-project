import { renderHeader } from "../ui.js";
import { configured } from "../firebase.js";
import { login, googleLogin, resetPassword, friendly, watchUser } from "../auth.js";

renderHeader("");
const form = document.getElementById("form");
const err = document.getElementById("error");
const btn = document.getElementById("submit");
// Only allow redirects to our own pages, e.g. profile.html?x=1
const next = new URLSearchParams(location.search).get("next") || "";
const dest = /^[\w-]+\.html(\?[\w=&%-]*)?$/.test(next) ? next : "index.html";
const go = () => (location.href = dest);

if (!configured) err.textContent = "Firebase is not set up yet. Paste your config into js/firebase-config.js.";
else watchUser((u) => u && go());

async function run(task) {
  err.textContent = "";
  btn.disabled = true;
  btn.textContent = "Please wait...";
  try { await task(); go(); }
  catch (e) { console.error(e); err.textContent = friendly(e); btn.disabled = false; btn.textContent = "Log in"; }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(form);
  if (!f.get("email") || !f.get("password")) { err.textContent = "Enter your email and password."; return; }
  run(() => login(f.get("email").trim(), f.get("password")));
});
document.getElementById("google").addEventListener("click", () => run(googleLogin));
document.getElementById("forgot").addEventListener("click", async () => {
  const email = form.email.value.trim();
  if (!email) { err.textContent = "Type your email above first, then click Forgot password."; return; }
  try { await resetPassword(email); err.style.color = "var(--muted)"; err.textContent = "If that email has an account, a reset link is on its way."; }
  catch (e) { err.style.color = ""; err.textContent = friendly(e); }
});
