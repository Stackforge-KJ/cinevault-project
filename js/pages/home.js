import { genres, getTrending, getMovie } from "../tmdb.js";
import { library } from "../library.js";
import { showWelcome } from "../welcome.js";
import { cardHTML, renderHeader } from "../ui.js";

renderHeader("Home");
showWelcome();
const hero = document.getElementById("hero");
const trending = document.getElementById("trending");
document.getElementById("genres").innerHTML = genres
  .map((g) => `<a class="chip" href="movies.html?genre=${encodeURIComponent(g)}">${g}</a>`).join("");

let movies = [], heroMovies = [], current = 0, timer;

function drawHero() {
  const m = heroMovies[current];
  hero.style.setProperty("--c1", m.c1 || "#1a2033");
  hero.style.setProperty("--c2", m.c2 || "#0a0d16");
  hero.style.backgroundImage = m.backdrop ? `url(${m.backdrop})` : "";
  hero.innerHTML = `
    <div class="hero-body">
      <h1>${m.title}</h1>
      <div class="meta">${[m.genres.slice(0, 2).join(", "), m.year, m.age].filter(Boolean).map((t) => `<span>${t}</span>`).join("")}</div>
      <p>${m.overview.length > 180 ? m.overview.slice(0, 177) + "..." : m.overview}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="watch.html?id=${m.id}">Watch now</a>
        <a class="btn btn-ghost" href="movie.html?id=${m.id}">More info</a>
      </div>
    </div>
    <div class="hero-nav">
      <button class="arrow" data-dir="-1" aria-label="Previous">&#8249;</button>
      ${heroMovies.map((_, i) => `<span class="dot" ${i === current ? 'aria-current="true"' : ""}></span>`).join("")}
      <button class="arrow" data-dir="1" aria-label="Next">&#8250;</button>
    </div>`;
}
const go = (d) => { current = (current + d + heroMovies.length) % heroMovies.length; drawHero(); };

hero.addEventListener("click", (e) => {
  const b = e.target.closest("[data-dir]");
  if (!b) return;
  go(+b.dataset.dir);
  clearInterval(timer);
});

trending.innerHTML = `<p class="msg">Loading movies...</p>`;
try {
  movies = await getTrending();
  heroMovies = movies.filter((m) => m.backdrop || m.c1).slice(0, 4);
  trending.innerHTML = movies.map(cardHTML).join("");
  Promise.all(library.map((f) => getMovie(f.id).catch(() => null))).then((films) => {
    films = films.filter(Boolean);
    if (!films.length) return;
    const sec = document.createElement("section");
    sec.className = "section wrap";
    sec.innerHTML = `<div class="section-head"><h2>Full films for subscribers</h2></div><div class="row">${films.map(cardHTML).join("")}</div>`;
    trending.closest("section").after(sec);
  });
  drawHero();
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(() => go(1), 7000);
} catch (err) {
  console.error(err);
  trending.innerHTML = `<p class="msg">Could not load movies. Check your internet connection and your TMDB key in js/config.js.</p>`;
}
