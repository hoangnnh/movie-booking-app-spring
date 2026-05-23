import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { movieApi } from "../api/api";

import MovieHero from "../components/movieDetail/MovieHero";
import MovieSummarySection from "../components/movieDetail/MovieSummarySection";
import CastSection from "../components/movieDetail/CastSection";
import ReviewsSection from "../components/movieDetail/ReviewsSection";
import ShowtimesSection from "../components/movieDetail/ShowtimesSection";

import { fallbackBackdrop } from "../components/movieDetail/movieDetailData";
import { formatDuration, getPosterUrl } from "../components/home/homeUtils";

export default function MovieDetailPage() {
  const { movieId } = useParams();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMovieDetail() {
      try {
        setLoading(true);
        setError("");

        const [movieData, showtimeData] = await Promise.all([
          movieApi.getById(movieId),
          movieApi.getShowtimes(movieId),
        ]);

        setMovie(movieData);
        setShowtimes(showtimeData);
      } catch {
        setError("Cannot load movie details.");
      } finally {
        setLoading(false);
      }
    }

    loadMovieDetail();
  }, [movieId]);

  const computedMovie = useMemo(() => {
    if (!movie) return null;

    return {
      ...movie,
      posterUrl: getPosterUrl(movie, 0),
      backdropUrl: getPosterUrl(movie, 1) || fallbackBackdrop,
      duration: formatDuration(movie.durationMinutes),
      genres: Array.isArray(movie.genres) ? movie.genres.join(", ") : "Drama",
      rating: movie.rating || "7.9",
      ageRating: movie.ageRating || "PG",
    };
  }, [movie]);

  if (loading) {
    return (
      <div className="ticketor-container py-[80px]">
        <p className="type-body-m text-app-text-muted">Loading movie...</p>
      </div>
    );
  }

  if (error || !computedMovie) {
    return (
      <div className="ticketor-container py-[80px]">
        <div className="rounded-card border border-error-500 bg-app-background p-[24px] text-error-500">
          {error || "Movie not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app-background text-app-text">
      <MovieHero
        movie={computedMovie}
        posterUrl={computedMovie.posterUrl}
        backdropUrl={computedMovie.backdropUrl}
        duration={computedMovie.duration}
        genres={computedMovie.genres}
        rating={computedMovie.rating}
        ageRating={computedMovie.ageRating}
        onGetTicket={() => {
          document
            .getElementById("showtimes")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <MovieSummarySection movie={computedMovie} />
      <CastSection />
      <ReviewsSection score={computedMovie.rating} />
      <ShowtimesSection showtimes={showtimes} />
    </div>
  );
}
