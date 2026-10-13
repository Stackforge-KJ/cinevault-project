import { TMDB_KEY } from "./config.js";
import { movies as sample, genres as sampleGenres, extras } from "./data.js";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/";
// No key yet? The site keeps working on the sample data.
export const live = !!TMDB_KEY && !TMDB_KEY.startsWith("PASTE");
export const genres = sampleGenres;

async function api(path, params = {}) {
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

// Genre names <-> ids, loaded once
const ALIAS = { "Sci-Fi": "Science Fiction" };
let genreById, genreIdByName;
async function loadGenres() {
  if (genreById) return;
  const { genres: list } = await api("/genre/movie/list");
  genreById = Object.fromEntries(list.map((g) => [g.id, g.name === "Science Fiction" ? "Sci-Fi" : g.name]));
  genreIdByName = Object.fromEntries(list.map((g) => [g.name, g.id]));
}

const fmt = (m) => ({
  id: m.id,
  title: m.title,
  year: (m.release_date || "").slice(0, 4),
  rating: m.vote_average ? +m.vote_average.toFixed(1) : 0,
  genres: (m.genre_ids || (m.genres || []).map((g) => g.id)).map((id) => genreById[id]).filter(Boolean),
  overview: m.overview,
  poster: m.poster_path ? IMG + "w342" + m.poster_path : "",
  backdrop: m.backdrop_path ? IMG + "w1280" + m.backdrop_path : "",
  age: m.adult ? "18+" : "",
});

export async function getTrending() {
  if (!live) return sample;
  await loadGenres();
  const data = await api("/trending/movie/week");
  return data.results.map(fmt);
}

// sort: "rating" | "year" | "title"
export async function getCatalogue({ genre = "All", q = "", sort = "rating" } = {}) {
  if (!live) {
    return sample
      .filter((m) => (genre === "All" || m.genres.includes(genre)) && m.title.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : b[sort] - a[sort]));
  }
  await loadGenres();
  if (q) {
    const data = await api("/search/movie", { query: q });
    const list = data.results.map(fmt).filter((m) => genre === "All" || m.genres.includes(genre));
    return list.sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : sort === "year" ? b.year - a.year : b.rating - a.rating));
  }
  const sortBy = { rating: "vote_average.desc", year: "primary_release_date.desc", title: "original_title.asc" }[sort];
  const params = { sort_by: sortBy, "vote_count.gte": sort === "rating" ? 500 : 50, include_adult: "false" };
  if (sort === "year") params["primary_release_date.lte"] = new Date().toISOString().slice(0, 10);
  if (genre !== "All") params.with_genres = genreIdByName[ALIAS[genre] || genre];
  const data = await api("/discover/movie", params);
  return data.results.map(fmt);
}

export async function getMovie(id, type = "movie") {
  if (type === "tv") return getShow(id);
  if (!live) {
    const m = sample.find((s) => s.id === +id);
    if (!m) return null;
    const x = extras[m.id] || {};
    return { ...m, ...x, cast: (x.cast || []).map((name) => ({ name, photo: "" })), trailerKey: "" };
  }
  await loadGenres();
  const m = await api(`/movie/${id}`, { append_to_response: "credits,videos" });
  const trailer = m.videos.results.find((v) => v.site === "YouTube" && v.type === "Trailer");
  return {
    ...fmt(m),
    duration: m.runtime ? `${Math.floor(m.runtime / 60)}h ${String(m.runtime % 60).padStart(2, "0")}m` : "",
    release: m.release_date,
    director: (m.credits.crew.find((c) => c.job === "Director") || {}).name || "",
    cast: m.credits.cast.slice(0, 8).map((c) => ({ name: c.name, photo: c.profile_path ? IMG + "w185" + c.profile_path : "" })),
    trailerKey: trailer ? trailer.key : "",
  };
}

// ---------- TV shows ----------
const TV_GENRES = { 10759: "Action", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 9648: "Mystery", 10764: "Reality", 10765: "Sci-Fi", 10768: "War & Politics", 37: "Western" };
const TV_IDS = { Action: 10759, Comedy: 35, Drama: 18, Crime: 80, Mystery: 9648, "Sci-Fi": 10765, Animation: 16, Reality: 10764 };
export const tvGenres = Object.keys(TV_IDS);

const fmtTv = (t) => ({
  id: t.id, type: "tv", title: t.name,
  year: (t.first_air_date || "").slice(0, 4),
  rating: t.vote_average ? +t.vote_average.toFixed(1) : 0,
  genres: (t.genre_ids || (t.genres || []).map((g) => g.id)).map((id) => TV_GENRES[id]).filter(Boolean),
  overview: t.overview,
  poster: t.poster_path ? IMG + "w342" + t.poster_path : "",
  backdrop: t.backdrop_path ? IMG + "w1280" + t.backdrop_path : "",
  age: "",
});

const sampleTv = [
  { id: 1, type: "tv", title: "Sample Series One", year: "2023", rating: 8.1, genres: ["Drama"], overview: "Sample show shown until a TMDB key is added.", c1: "#2a1a3b", c2: "#0a0d16" },
  { id: 2, type: "tv", title: "Sample Series Two", year: "2022", rating: 7.4, genres: ["Comedy"], overview: "Sample show shown until a TMDB key is added.", c1: "#1a3b2a", c2: "#0a0d16" },
  { id: 3, type: "tv", title: "Sample Series Three", year: "2024", rating: 8.6, genres: ["Sci-Fi"], overview: "Sample show shown until a TMDB key is added.", c1: "#3b2a1a", c2: "#0a0d16" },
];

export async function getTrendingTv() {
  if (!live) return sampleTv;
  return (await api("/trending/tv/week")).results.map(fmtTv);
}

export async function getTvCatalogue({ genre = "All", q = "", sort = "rating" } = {}) {
  if (!live) {
    return sampleTv
      .filter((m) => (genre === "All" || m.genres.includes(genre)) && m.title.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : b[sort] - a[sort]));
  }
  if (q) {
    const list = (await api("/search/tv", { query: q })).results.map(fmtTv).filter((m) => genre === "All" || m.genres.includes(genre));
    return list.sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : sort === "year" ? b.year - a.year : b.rating - a.rating));
  }
  const sortBy = { rating: "vote_average.desc", year: "first_air_date.desc", title: "original_name.asc" }[sort];
  const params = { sort_by: sortBy, "vote_count.gte": sort === "rating" ? 200 : 20, include_adult: "false" };
  if (sort === "year") params["first_air_date.lte"] = new Date().toISOString().slice(0, 10);
  if (genre !== "All") params.with_genres = TV_IDS[genre];
  return (await api("/discover/tv", params)).results.map(fmtTv);
}

async function getShow(id) {
  if (!live) return sampleTv.find((s) => s.id === +id) ? { ...sampleTv.find((s) => s.id === +id), cast: [], trailerKey: "", duration: "", director: "" } : null;
  const t = await api(`/tv/${id}`, { append_to_response: "credits,videos" });
  const trailer = t.videos.results.find((v) => v.site === "YouTube" && v.type === "Trailer");
  return {
    ...fmtTv(t),
    duration: t.number_of_seasons ? `${t.number_of_seasons} season${t.number_of_seasons === 1 ? "" : "s"}` : "",
    release: t.first_air_date,
    director: (t.created_by || []).map((c) => c.name).join(", "),
    cast: t.credits.cast.slice(0, 8).map((c) => ({ name: c.name, photo: c.profile_path ? IMG + "w185" + c.profile_path : "" })),
    trailerKey: trailer ? trailer.key : "",
  };
}
