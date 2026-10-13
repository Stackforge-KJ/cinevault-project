import { genres, getCatalogue, tvGenres, getTvCatalogue } from "../tmdb.js";
import { cardHTML, renderHeader, skeletonCards } from "../ui.js";

const isTv = document.body.dataset.type === "tv";
const genreList = isTv ? tvGenres : genres;
const load = isTv ? getTvCatalogue : getCatalogue;
renderHeader(isTv ? "TV Shows" : "Movies");
let genre = new URLSearchParams(location.search).get("genre") || "All";
const q = document.getElementById("q");
const sort = document.getElementById("sort");
const grid = document.getElementById("grid");
let run = 0, wait;

function drawFilters() {
  document.getElementById("filters").innerHTML = ["All", ...genreList]
    .map((g) => `<button class="pill" data-g="${g}" aria-pressed="${g === genre}">${g}</button>`).join("");
}
async function drawGrid() {
  const id = ++run; // ignore slow responses that arrive out of order
  grid.innerHTML = skeletonCards(12);
  try {
    const list = await load({ genre, q: q.value.trim(), sort: sort.value });
    if (id !== run) return;
    grid.innerHTML = list.length ? list.map(cardHTML).join("") : `<p class="empty">No movies match. Try another genre or search term.</p>`;
  } catch (err) {
    console.error(err);
    if (id === run) grid.innerHTML = `<p class="msg">Could not load the list. Check your internet connection and your TMDB key in js/config.js.</p>`;
  }
}
document.getElementById("filters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-g]");
  if (!b) return;
  genre = b.dataset.g;
  drawFilters();
  drawGrid();
});
q.addEventListener("input", () => { clearTimeout(wait); wait = setTimeout(drawGrid, 350); });
sort.addEventListener("change", drawGrid);
drawFilters();
drawGrid();
