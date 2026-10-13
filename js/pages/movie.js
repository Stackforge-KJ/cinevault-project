import { getMovie } from "../tmdb.js";
import { posterHTML, renderHeader, esc } from "../ui.js";
import { configured } from "../firebase.js";
import { watchUser } from "../auth.js";
import { inWishlist, toggleWishlist, getPlaylists, createPlaylist, addToPlaylist } from "../store.js";

renderHeader("Movies");
const main = document.getElementById("main");
const initials = (n) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
main.innerHTML = `<p class="msg">Loading...</p>`;

try {
  const qs = new URLSearchParams(location.search);
  const m = await getMovie(qs.get("id"), qs.get("type") === "tv" ? "tv" : "movie");
  if (!m) throw new Error("not found");
  document.title = `${m.title} | CineVault`;
  main.innerHTML = `
    <section class="detail">
      ${posterHTML(m)}
      <div>
        <h1>${m.title}</h1>
        <div class="meta" style="margin-top:.5rem">${[m.year, m.duration, m.genres.join(", "), m.age, m.rating ? "&#9733; " + m.rating : ""].filter(Boolean).map((t) => `<span>${t}</span>`).join("")}</div>
        <p style="max-width:60ch;color:#c9cfdf">${m.overview}</p>
        <div class="actions">
          <a class="btn btn-primary" href="watch.html?id=${m.id}${m.type === "tv" ? "&type=tv" : ""}">Watch now</a>
          <button class="btn btn-ghost" disabled>Download</button>
          <button class="btn btn-ghost" id="wish" type="button" ${m.type === "tv" ? "hidden" : ""}>Add to wishlist</button>
          <button class="btn btn-ghost" id="plist" type="button" ${m.type === "tv" ? "hidden" : ""}>Add to playlist</button>
        </div>
        <p class="hint">Full films and downloads are for subscribers.</p>
        <h2 style="font-size:var(--fs-lg);margin-top:2rem">More details</h2>
        <dl class="facts">
          <dt>${m.type === "tv" ? "Creator" : "Director"}</dt><dd>${m.director || "-"}</dd>
          <dt>Release date</dt><dd>${m.release || m.year || "-"}</dd>
          <dt>Duration</dt><dd>${m.duration || "-"}</dd>
        </dl>
      </div>
    </section>
    ${m.trailerKey ? `<section><h2 style="font-size:var(--fs-lg)">Trailer</h2>
      <div class="trailer"><iframe src="https://www.youtube-nocookie.com/embed/${m.trailerKey}" title="${m.title} trailer" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div></section>` : ""}
    <section style="padding-block:2rem 1rem">
      <h2 style="font-size:var(--fs-lg)">Cast</h2>
      <div class="cast">${m.cast.map((c) => `<div class="person"><div class="avatar">${c.photo ? `<img src="${c.photo}" alt="" loading="lazy">` : initials(c.name)}</div>${c.name}</div>`).join("")}</div>
    </section>`;

  const wish = document.getElementById("wish");
  let user = null, saved = false;
  const paint = () => { wish.textContent = saved ? "In your list" : "Add to wishlist"; wish.setAttribute("aria-pressed", saved); };
  if (configured) watchUser(async (u) => { user = u; saved = u ? await inWishlist(u.uid, m.id).catch(() => false) : false; paint(); });
  wish.addEventListener("click", async () => {
    if (!user) { location.href = `login.html?next=${encodeURIComponent("movie.html?id=" + m.id)}`; return; }
    wish.disabled = true;
    try { saved = await toggleWishlist(user.uid, m); } catch (e) { console.error(e); }
    wish.disabled = false;
    paint();
  });

  const dlg = document.createElement("dialog");
  dlg.className = "pl-dialog";
  document.body.append(dlg);
  document.getElementById("plist").addEventListener("click", async () => {
    if (!user) { location.href = `login.html?next=${encodeURIComponent("movie.html?id=" + m.id)}`; return; }
    dlg.innerHTML = `<h2>Add to playlist</h2><div id="plBody" class="pl-body"><p class="hint">Loading...</p></div>
      <form id="plNew" class="pl-new"><input class="field" name="name" maxlength="40" placeholder="New playlist name" aria-label="New playlist name" required><button class="btn btn-primary btn-sm">Create</button></form>
      <button class="btn btn-ghost btn-sm" id="plClose" type="button">Close</button>`;
    dlg.showModal();
    const body = dlg.querySelector("#plBody");
    const draw = async () => {
      try {
        const lists = await getPlaylists(user.uid);
        body.innerHTML = lists.length
          ? lists.map((l) => { const has = l.movies.some((x) => x.id === m.id); return `<button class="pl-item" data-id="${l.id}" ${has ? "disabled" : ""}>${esc(l.name)} <small>${has ? "Added" : l.movies.length + " movies"}</small></button>`; }).join("")
          : `<p class="hint">No playlists yet. Create one below.</p>`;
      } catch (e) { console.error(e); body.innerHTML = `<p class="hint">Could not load playlists.</p>`; }
    };
    body.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-id]");
      if (!b) return;
      b.disabled = true;
      await addToPlaylist(user.uid, b.dataset.id, m).catch(console.error);
      draw();
    });
    dlg.querySelector("#plNew").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = e.target.name.value.trim();
      if (!name) return;
      await createPlaylist(user.uid, name, m).catch(console.error);
      e.target.reset();
      draw();
    });
    dlg.querySelector("#plClose").addEventListener("click", () => dlg.close());
    draw();
  });
} catch (err) {
  console.error(err);
  main.innerHTML = `<p class="empty">Could not load this movie. <a href="movies.html" style="color:var(--accent)">Browse all movies</a></p>`;
}
