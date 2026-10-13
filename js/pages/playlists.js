import { renderHeader, cardHTML, esc } from "../ui.js";
import { configured } from "../firebase.js";
import { requireAuth } from "../auth.js";
import { getPlaylists, createPlaylist, removeFromPlaylist, deletePlaylist } from "../store.js";

renderHeader("");
const main = document.getElementById("main");

if (!configured) {
  main.innerHTML = `<p class="msg">Firebase is not set up yet. Paste your config into js/firebase-config.js.</p>`;
} else {
  const user = await requireAuth();
  main.innerHTML = `<h1 class="page-title">My playlists</h1>
    <form class="toolbar" id="new"><input class="field grow" name="name" maxlength="40" placeholder="New playlist name" aria-label="Playlist name" required><button class="btn btn-primary">Create playlist</button></form>
    <div id="lists"><p class="msg">Loading...</p></div>`;
  const el = document.getElementById("lists");
  let lists = [];

  const draw = () => {
    const open = new Set([...el.querySelectorAll("details[open]")].map((d) => d.dataset.pid));
    el.innerHTML = lists.length ? lists.map((l) => `
      <details class="playlist" data-pid="${l.id}" ${open.has(l.id) ? "open" : ""}>
        <summary>${esc(l.name)} <small>${l.movies.length} movies</small></summary>
        <div class="grid">${l.movies.map((m) => `<div class="wish-item">${cardHTML(m)}<button class="btn btn-ghost btn-sm" data-rm="${m.id}">Remove</button></div>`).join("") || `<p class="hint">Empty. Add movies from a movie page.</p>`}</div>
        <button class="btn btn-ghost btn-sm" data-del type="button" style="margin-top:1rem">Delete playlist</button>
      </details>`).join("") : `<p class="empty">No playlists yet. Create one above.</p>`;
  };
  const load = async () => {
    try { lists = await getPlaylists(user.uid); draw(); }
    catch (e) { console.error(e); el.innerHTML = `<p class="msg">Could not load playlists. Check your Firestore rules are published.</p>`; }
  };

  document.getElementById("new").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    if (!name) return;
    await createPlaylist(user.uid, name).catch(console.error);
    e.target.reset();
    load();
  });
  el.addEventListener("click", async (e) => {
    const pid = e.target.closest("details")?.dataset.pid;
    if (e.target.closest("[data-rm]")) { await removeFromPlaylist(user.uid, pid, e.target.closest("[data-rm]").dataset.rm).catch(console.error); load(); }
    else if (e.target.closest("[data-del]") && confirm("Delete this playlist?")) { await deletePlaylist(user.uid, pid).catch(console.error); load(); }
  });
  load();
}
