import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { favoritesApi, movieApi } from "../api/api";

import MovieHero from "../components/movieDetail/MovieHero";
import MovieSummarySection from "../components/movieDetail/MovieSummarySection";
import CastSection from "../components/movieDetail/CastSection";
import ReviewsSection from "../components/movieDetail/ReviewsSection";
import ShowtimesSection from "../components/movieDetail/ShowtimesSection";

import { formatDuration, getPosterUrl } from "../components/home/homeUtils";
import { useAuth } from "../context/useAuth";

export default function MovieDetailPage({ onRequireAuth }) {
  const { movieId } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");

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

  useEffect(() => {
    let ignore = false;

    async function loadFavoriteState() {
      if (!isAuthenticated || !user?.userId || !movieId) {
        setIsFavorite(false);
        setFavoriteMessage("");
        return;
      }

      try {
        setFavoriteLoading(true);
        const response = await favoritesApi.isFavorite(user.userId, movieId);

        if (!ignore) {
          setIsFavorite(Boolean(response.favorite));
        }
      } catch {
        if (!ignore) {
          setFavoriteMessage("Cannot load your favorite status right now.");
        }
      } finally {
        if (!ignore) {
          setFavoriteLoading(false);
        }
      }
    }

    loadFavoriteState();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, movieId, user?.userId]);

  const computedMovie = useMemo(() => {
    if (!movie) return null;

    return {
      ...movie,
      posterUrl: getPosterUrl(movie, 0),
      backdropUrl: movie.backdropUrl || getPosterUrl(movie, 1),
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

  async function handleToggleFavorite() {
    if (!isAuthenticated || !user?.userId) {
      onRequireAuth?.();
      return;
    }

    try {
      setFavoriteLoading(true);
      setFavoriteMessage("");

      const response = isFavorite
        ? await favoritesApi.removeFavorite(user.userId, movieId)
        : await favoritesApi.addFavorite(user.userId, movieId);

      const nextFavoriteState = Boolean(response.favorite);
      setIsFavorite(nextFavoriteState);
      setFavoriteMessage(
        nextFavoriteState
          ? "Added to your favorites."
          : "Removed from your favorites."
      );
    } catch {
      setFavoriteMessage("We couldn't update favorites right now.");
    } finally {
      setFavoriteLoading(false);
    }
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
        onToggleFavorite={handleToggleFavorite}
        favoriteButtonLabel={
          !isAuthenticated
            ? "Sign In to Save"
            : favoriteLoading
              ? "Saving..."
              : isFavorite
                ? "Saved"
                : "Add to Favorites"
        }
        favoriteActive={isFavorite}
        favoriteDisabled={favoriteLoading}
      />

      {favoriteMessage && (
        <div className="ticketor-container pt-[16px]">
          <div className="rounded-card border border-app-border bg-app-surface px-[16px] py-[12px] type-body-s text-app-text-muted">
            {favoriteMessage}
          </div>
        </div>
      )}

      <MovieSummarySection movie={computedMovie} />
      <CastSection cast={computedMovie.cast} />
      <ReviewsSection score={computedMovie.rating} />
      <ShowtimesSection showtimes={showtimes} />
    </div>
  );
}
