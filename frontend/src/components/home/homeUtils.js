import { fallbackPosters } from "./homeData";

export function formatDuration(minutes) {
  if (!minutes) return "2h 2m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) return `${remainingMinutes}m`;

  return `${hours}h ${remainingMinutes}m`;
}

export function getPosterUrl(movie, index = 0) {
  if (
    movie?.posterUrl &&
    !movie.posterUrl.includes("example.com") &&
    movie.posterUrl.startsWith("http")
  ) {
    return movie.posterUrl;
  }

  return fallbackPosters[index % fallbackPosters.length];
}

export function normalizeMovie(movie, index = 0) {
  return {
    id: movie.id,
    title: movie.title || "Untitled Movie",
    genres: Array.isArray(movie.genres) ? movie.genres.join(", ") : "Drama",
    duration: formatDuration(movie.durationMinutes),
    rating: movie.rating || "8.5",
    ageRating: movie.ageRating || "PG-13",
    posterUrl: getPosterUrl(movie, index),
    releaseDate: movie.releaseDate,
  };
}

export function isComingSoon(movie) {
  if (!movie.releaseDate) return false;

  return new Date(movie.releaseDate) > new Date();
}