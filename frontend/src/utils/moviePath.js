function getMovieReference(movie) {
  if (movie?.slug) {
    return movie.slug;
  }

  return movie?.id || "";
}

export function getMovieBookingPath(movie) {
  return `/booking/${getMovieReference(movie)}`;
}

export function getUnavailableMoviePath(movie) {
  return `/movies/${getMovieReference(movie)}`;
}

export function getMovieDetailPath(movie) {
  return movie?.displayStatus === "HIDDEN"
    ? getUnavailableMoviePath(movie)
    : getMovieBookingPath(movie);
}
