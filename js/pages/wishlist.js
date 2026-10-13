import { renderHeader, cardHTML } from "../ui.js";
import { configured } from "../firebase.js";
import { requireAuth } from "../auth.js";
import { getWishlist, removeFromWishlist } from "../store.js";

renderHeader("");
const main = document.getElementById("main");

if (!configured) {
  main.innerHTML = `<p class="msg">Firebase is not set up yet. Paste your config into js/firebase-config.js.</p>`;
} else {
  const user = await requireAuth();
  const empty = `<p class="empty">Your list is empty. <a href="movies.html" style="color:var(--accent)">Browse movies</a> and tap "Add to wishlist".</p>`;
  main.innerHTML = `<h1 class="page-title">My list</h1><p class="hint">Movies you have saved for later.</p><div class="grid" id="grid" style="margin-top:1.5rem"></div>`;
  const grid = document.getElementById("grid");
  try {
    const list = await getWishlist(user.uid);
    grid.innerHTML = list.length
      ? list.map((m) => `<div class="wish-item">${cardHTML(m)}<button class="btn btn-ghost btn-sm" data-remove="${m.id}">Remove</button></div>`).join("")
      : empty;
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<p class="msg">Could not load your list. Check your Firestore rules are published.</p>`;
  }
  grid.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-remove]");
    if (!b) return;
    b.disabled = true;
    try {
      await removeFromWishlist(user.uid, b.dataset.remove);
      b.closest(".wish-item").remove();
      if (!grid.children.length) grid.innerHTML = empty;
    } catch (err) { console.error(err); b.disabled = false; }
  });
}
