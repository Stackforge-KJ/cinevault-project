// Sample data. Replaced by TMDB in step 2 (same field names where possible).
export const movies = [
  { id: 1, title: "The Last Kingdom", year: 2023, rating: 7.8, age: "16+", genres: ["Action", "Drama"], overview: "A former king returns to reclaim his throne and protect his people from a new threat.", c1: "#3b2a1a", c2: "#0f1a2b" },
  { id: 2, title: "Extraction 2", year: 2023, rating: 7.1, age: "16+", genres: ["Action", "Thriller"], overview: "A mercenary takes one last job to bring a family out of a prison nobody escapes.", c1: "#1c2b3a", c2: "#3a2216" },
  { id: 3, title: "Oppenheimer", year: 2023, rating: 8.6, age: "16+", genres: ["Drama", "Biography"], overview: "The story of J. Robert Oppenheimer and the creation of the atomic bomb.", c1: "#7a2a10", c2: "#1a1210" },
  { id: 4, title: "The Equalizer 3", year: 2023, rating: 7.2, age: "16+", genres: ["Action", "Thriller"], overview: "Robert McCall finds a new home in southern Italy and a new fight.", c1: "#1a2430", c2: "#2b1a1a" },
  { id: 5, title: "Barbie", year: 2023, rating: 6.9, age: "13+", genres: ["Comedy"], overview: "Barbie leaves Barbieland and discovers the real world is more complicated.", c1: "#d94c8f", c2: "#5b2a8a" },
  { id: 6, title: "Spider-Man: Across the Spider-Verse", year: 2023, rating: 8.7, age: "10+", genres: ["Animation", "Action"], overview: "Miles Morales travels across the multiverse and meets a team of Spider-People.", c1: "#7a1d6e", c2: "#15235e" },
  { id: 7, title: "John Wick 4", year: 2023, rating: 7.6, age: "18+", genres: ["Action", "Thriller"], overview: "John Wick takes on the High Table and the people who serve it.", c1: "#10263d", c2: "#0a0d16" },
];

export const genres = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller", "Animation"];

export const byId = (id) => movies.find((m) => m.id === +id);

// Extra detail-page fields (TMDB credits replace these in step 2)
export const extras = {
  1: { director: "Marcus Hale", duration: "2h 12m", release: "Mar 10, 2023", cast: ["Idris Vale", "Nora Kane", "Tomas Reid", "Ayo Bello"] },
  2: { director: "Sam Hargrave", duration: "2h 02m", release: "Jun 16, 2023", cast: ["Chris Hemsworth", "Golshifteh Farahani", "Adam Bessa", "Tinatin Dalakishvili"] },
  3: { director: "Christopher Nolan", duration: "3h 00m", release: "Jul 21, 2023", cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."] },
  4: { director: "Antoine Fuqua", duration: "1h 49m", release: "Sep 1, 2023", cast: ["Denzel Washington", "Dakota Fanning", "Eugenio Mastrandrea", "David Denman"] },
  5: { director: "Greta Gerwig", duration: "1h 54m", release: "Jul 21, 2023", cast: ["Margot Robbie", "Ryan Gosling", "America Ferrera", "Kate McKinnon"] },
  6: { director: "Joaquim Dos Santos", duration: "2h 20m", release: "Jun 2, 2023", cast: ["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac", "Issa Rae"] },
  7: { director: "Chad Stahelski", duration: "2h 49m", release: "Mar 24, 2023", cast: ["Keanu Reeves", "Donnie Yen", "Bill Skarsgard", "Laurence Fishburne"] },
};
