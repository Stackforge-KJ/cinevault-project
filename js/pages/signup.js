import { renderHeader } from "../ui.js";
import { configured } from "../firebase.js";
import { signUp, googleLogin, friendly, watchUser } from "../auth.js";

renderHeader("");
const form = document.getElementById("form");
const err = document.getElementById("error");
const btn = document.getElementById("submit");
const go = () => (location.href = "index.html");

if (!configured) err.textContent = "Firebase is not set up yet. Paste your config into js/firebase-config.js.";
else watchUser((u) => u && go());

async function run(task, label) {
  err.textContent = "";
  btn.disabled = true;
  btn.textContent = "Please wait...";
  try { await task(); go(); }
  catch (e) { console.error(e); err.textContent = friendly(e); btn.disabled = false; btn.textContent = label; }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!form.checkValidity()) { err.textContent = form.querySelector(":invalid").title || "Check the highlighted fields and try again."; form.reportValidity(); return; }
  const f = new FormData(form);
  if (f.get("password") !== f.get("confirm")) { err.textContent = "The two passwords do not match."; return; }
  const photo = f.get("photo");
  if (photo && photo.size > 2 * 1024 * 1024) { err.textContent = "Choose a picture under 2 MB."; return; }
  run(() => signUp({ username: f.get("username").trim(), email: f.get("email").trim(), password: f.get("password"), photo }), "Create account");
});
document.getElementById("google").addEventListener("click", () => run(googleLogin, "Create account"));
