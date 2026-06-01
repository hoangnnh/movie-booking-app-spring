export function formatDuration(minutes) {
  if (!minutes) return "2h 2m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) return `${remainingMinutes}m`;

  return `${hours}h ${remainingMinutes}m`;
}

export function getPosterUrl(movie) {
  if (
    movie?.posterUrl &&
    !movie.posterUrl.includes("example.com") &&
    movie.posterUrl.startsWith("http")
  ) {
    return movie.posterUrl;
  }

  return "";
}

export function normalizeMovie(movie) {
  return {
    id: movie.id,
    slug: movie.slug,
    title: movie.title || "Untitled Movie",
    genres: Array.isArray(movie.genres) ? movie.genres.join(", ") : "Drama",
    duration: formatDuration(movie.durationMinutes),
    rating: movie.rating ? Number(movie.rating).toFixed(1) : "8.5",
    ageRating: movie.ageRating || "T13",
    posterUrl: getPosterUrl(movie),
    trailerUrl: movie.trailerUrl || "",
    releaseDate: movie.releaseDate,
    displayStatus: movie.displayStatus || "HIDDEN",
  };
}

export function isComingSoon(movie) {
  if (movie.displayStatus) return movie.displayStatus === "COMING_SOON";

  if (!movie.releaseDate) return false;

  return new Date(movie.releaseDate) > new Date();
}
