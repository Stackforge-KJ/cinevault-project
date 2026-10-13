import { getMovie, getTrending } from "../tmdb.js";
import { posterHTML, renderHeader } from "../ui.js";
import { configured } from "../firebase.js";
import { watchUser } from "../auth.js";
import { library } from "../library.js";

renderHeader("Movies");
const main = document.getElementById("main");
main.innerHTML = `<p class="msg">Loading...</p>`;

try {
  const qs = new URLSearchParams(location.search);
  const id = qs.get("id");
  const type = qs.get("type") === "tv" ? "tv" : "movie";
  const film = type === "tv" ? null : library.find((f) => String(f.id) === id);
  // Wait for the first login state so we know whether to unlock the film.
  const user = configured ? await new Promise((res) => { const stop = watchUser((u) => { stop(); res(u); }); }) : null;
  const [m, more] = await Promise.all([getMovie(id, type), getTrending()]);
  if (!m) throw new Error("not found");
  document.title = `Watching ${m.title} | CineVault`;

  let screen, download = `<button class="btn btn-ghost" disabled>Download</button>`, note = "You are watching the trailer.";
  if (film && user && user.isSubscribed) {
    screen = `<video controls preload="metadata" src="${film.src}"></video>`;
    download = `<a class="btn btn-ghost" href="${film.src}" download target="_blank" rel="noopener">Download</a>`;
    note = "";
  } else if (film) {
    const [label, href] = user ? ["Subscribe", "plans.html"] : ["Log in", `login.html?next=${encodeURIComponent("watch.html?id=" + id)}`];
    screen = `<div class="notice"><strong>Full film for subscribers</strong><p class="hint" style="margin:.5rem 0 1rem">Subscribe to watch and download ${m.title}.</p><a class="btn btn-primary" href="${href}">${label}</a></div>`;
    note = "";
  } else if (m.trailerKey) {
    screen = `<iframe src="https://www.youtube-nocookie.com/embed/${m.trailerKey}" title="${m.title} trailer" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  } else {
    screen = `<div class="notice"><strong>${m.title}</strong><p class="hint">No trailer is available for this title.</p></div>`;
  }

  main.innerHTML = `
    <div class="player-layout">
      <section>
        <div class="player" style="--c1:${m.c1 || "#1a2033"};--c2:${m.c2 || "#0a0d16"}">${screen}</div>
        <div class="player-info">
          <div>
            <h1>${m.title}</h1>
            <div class="meta">${[m.year, m.genres.join(", "), m.age].filter(Boolean).map((t) => `<span>${t}</span>`).join("")}</div>
            <p style="color:#c9cfdf;max-width:60ch">${m.overview}</p>
            ${note ? `<p class="hint">${note} Full films are marked "for subscribers" on the home page.</p>` : ""}
          </div>
          ${download}
        </div>
      </section>
      <aside class="up-next">
        <h2>Up next</h2>
        ${more.filter((n) => n.id !== m.id).slice(0, 4).map((n) => `
          <a class="next-item" href="watch.html?id=${n.id}">${posterHTML(n)}
            <div><div class="card-title" style="white-space:normal">${n.title}</div><div class="card-sub">${n.year}</div></div></a>`).join("")}
      </aside>
    </div>`;
} catch (err) {
  console.error(err);
  main.innerHTML = `<p class="empty">Could not load this movie. <a href="movies.html" style="color:var(--accent)">Browse all movies</a></p>`;
}
