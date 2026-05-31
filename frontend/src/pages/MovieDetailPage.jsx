import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { movieApi } from "../api/api";

import MovieHero from "../components/movieDetail/MovieHero";
import MovieSection from "../components/home/MovieSection";
import MovieSummarySection from "../components/movieDetail/MovieSummarySection";
import CastSection from "../components/movieDetail/CastSection";
import ReviewsSection from "../components/movieDetail/ReviewsSection";
import ShowtimesSection from "../components/movieDetail/ShowtimesSection";

import { formatDuration, getPosterUrl, isComingSoon } from "../components/home/homeUtils";
import { getEmbeddedTrailerUrl } from "../components/movieDetail/trailerUtils";
import { getMovieDetailPath } from "../utils/moviePath";

export default function MovieDetailPage() {
  const { movieRef } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    async function loadMovieDetail() {
      try {
        setLoading(true);
        setError("");

        const movieData = await movieApi.getById(movieRef);
        const showtimeData = await movieApi.getShowtimes(movieData.id);

        setMovie(movieData);
        setShowtimes(showtimeData);
      } catch {
        setError("Cannot load movie details.");
      } finally {
        setLoading(false);
      }
    }

    loadMovieDetail();
  }, [movieRef]);

  useEffect(() => {
    let ignore = false;

    async function loadSimilarMovies() {
      if (!movie?.id) {
        setSimilarMovies([]);
        return;
      }

      try {
        const data = await movieApi.getSimilar(movie.id, 8);

        if (!ignore) {
          setSimilarMovies(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!ignore) {
          setSimilarMovies([]);
        }
      }
    }

    loadSimilarMovies();

    return () => {
      ignore = true;
    };
  }, [movie?.id]);

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
      trailerEmbedUrl: getEmbeddedTrailerUrl(movie.trailerUrl),
    };
  }, [movie]);

  const visibleSimilarMovies = useMemo(() => {
    return similarMovies.filter((item) => !isComingSoon(item));
  }, [similarMovies]);
  const bookingAvailable = computedMovie?.displayStatus === "SHOWING_NOW";

  useEffect(() => {
    if (!computedMovie) return;

    const canonicalPath = getMovieDetailPath(computedMovie);

    if (location.pathname !== canonicalPath) {
      navigate(`${canonicalPath}${location.search}${location.hash}`, {
        replace: true,
      });
    }
  }, [computedMovie, location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!isTrailerOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsTrailerOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTrailerOpen]);

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
        onPlayTrailer={() => setIsTrailerOpen(true)}
        trailerAvailable={Boolean(computedMovie.trailerEmbedUrl)}
        bookingAvailable={bookingAvailable}
      />

      <MovieSummarySection movie={computedMovie} />
      <CastSection cast={computedMovie.cast} />
      <ReviewsSection score={computedMovie.rating} />
      <ShowtimesSection showtimes={showtimes} bookingAvailable={bookingAvailable} />
      {visibleSimilarMovies.length > 0 && (
        <MovieSection
          title="More Like This"
          description="Java-side similarity picks paired with your upgraded recommendation engine."
          movies={visibleSimilarMovies}
          status="released"
          limit={8}
        />
      )}

      {isTrailerOpen && computedMovie.trailerEmbedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-[20px]"
          role="dialog"
          aria-modal="true"
          aria-label={`${computedMovie.title} trailer`}
          onClick={() => setIsTrailerOpen(false)}
        >
          <div
            className="w-full max-w-[960px] overflow-hidden rounded-card border border-app-border bg-app-surface shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-app-border px-[20px] py-[16px]">
              <div>
                <p className="type-label-s text-app-text-subtle">Now playing</p>
                <h2 className="type-h5 text-app-text">{computedMovie.title}</h2>
              </div>

              <button
                type="button"
                onClick={() => setIsTrailerOpen(false)}
                className="rounded-button border border-app-border px-[16px] py-[8px] type-button-m text-app-text transition-colors hover:bg-app-background"
              >
                Close
              </button>
            </div>

            <div className="aspect-video bg-black">
              <iframe
                src={computedMovie.trailerEmbedUrl}
                title={`${computedMovie.title} trailer`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
