import { genres, tvGenres } from "../tmdb.js";
import { renderHeader } from "../ui.js";

renderHeader("Categories");
const tile = (name, href, i) => `<a class="cat-tile" style="--h:${(i * 47) % 360}" href="${href}">${name}</a>`;
document.getElementById("main").innerHTML = `
  <h1 class="page-title">Categories</h1>
  <section class="section"><div class="section-head"><h2>Movie genres</h2></div>
    <div class="cat-grid">${genres.map((g, i) => tile(g, `movies.html?genre=${encodeURIComponent(g)}`, i)).join("")}</div></section>
  <section class="section"><div class="section-head"><h2>TV show genres</h2></div>
    <div class="cat-grid">${tvGenres.map((g, i) => tile(g, `tv.html?genre=${encodeURIComponent(g)}`, i + 3)).join("")}</div></section>`;
