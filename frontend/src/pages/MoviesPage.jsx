import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MovieCard from "../components/movie/MovieCard";
import { movieApi } from "../api/api";
import { formatDuration, getPosterUrl, isComingSoon } from "../components/home/homeUtils";
import { useTheme } from "../context/useTheme";
import { getMovieDetailPath } from "../utils/moviePath";

const CATALOG_SIZE = 48;

export default function MoviesPage({ statusFilter = "released" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLightMode } = useTheme();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isShowingNow = statusFilter === "released";
  const query = searchParams.get("query") || "";

  useEffect(() => {
    let ignore = false;

    async function loadMovies() {
      try {
        setLoading(true);
        setError("");
        const data = await movieApi.getCatalog({
          status: toDisplayStatus(statusFilter),
          query,
          page: 0,
          size: CATALOG_SIZE,
        });

        if (ignore) {
          return;
        }

        const nextMovies = Array.isArray(data?.items) ? data.items : [];
        setMovies(nextMovies);
      } catch {
        if (!ignore) {
          setError("Cannot load movies from server.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadMovies();

    return () => {
      ignore = true;
    };
  }, [query, statusFilter]);

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[48px]">
        <section
          className="overflow-hidden rounded-tk-12 border border-app-border px-[28px] py-[32px]"
          style={{
            background: isLightMode
              ? "radial-gradient(circle at top left, rgba(170,143,0,0.14), transparent 30%), linear-gradient(135deg, rgba(255,253,248,1), rgba(240,234,220,1))"
              : "radial-gradient(circle at top left, rgba(251,251,30,0.18), transparent 30%), linear-gradient(135deg, rgba(53,53,65,1), rgba(20,20,24,1))",
          }}
        >
          <p className="type-label-m text-brand">MOVIES</p>
          <div className="mt-[10px] flex flex-wrap items-end justify-between gap-[16px] border-b border-app-border pb-[12px]">
            <h1 className="type-h2 max-w-[680px] text-app-text">
              {isShowingNow ? "Showing Now" : "Coming Soon"}
            </h1>
            <Link
              to={isShowingNow ? "/movies/coming-soon" : "/movies/showing-now"}
              className="type-button-l uppercase text-app-text-muted transition-colors hover:text-brand"
            >
              {isShowingNow ? "Coming Soon" : "Showing Now"}
            </Link>
          </div>
          <p className="type-body-m mt-[12px] max-w-[720px] text-app-text-muted">
            {isShowingNow
              ? "Choose a movie currently available in cinemas and book your showtime."
              : "Preview upcoming movies before they arrive in cinemas."}
          </p>
        </section>

        {loading && (
          <div className="py-[56px]">
            <p className="type-body-m text-app-text-muted">Loading movies...</p>
          </div>
        )}

        {error && (
          <div className="py-[32px]">
            <div className="rounded-tk-8 border border-error-500 bg-app-background p-[16px] text-error-500">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && movies.length === 0 && (
          <div className="mt-[28px] rounded-tk-12 border border-app-border bg-app-surface p-[40px] text-center">
            <h2 className="type-h5 text-app-text">No movies available in this section.</h2>
            <p className="type-body-s mt-[8px] text-app-text-muted">
              Import more titles to populate this section.
            </p>
          </div>
        )}

        {!loading && !error && movies.length > 0 && (
          <section className="mt-[28px] grid gap-x-[24px] gap-y-[32px] sm:grid-cols-2 lg:grid-cols-4">
              {movies.map((movie, index) => {
                const comingSoon = isComingSoon(movie);
                const cardStatus =
                  movie.displayStatus === "HIDDEN"
                    ? "hidden"
                    : comingSoon
                      ? "coming-soon"
                      : "released";

                return (
                  <MovieCard
                    key={movie.id}
                    title={movie.title || "Untitled Movie"}
                    genres={
                      Array.isArray(movie.genres) && movie.genres.length > 0
                        ? movie.genres.join(", ")
                        : "Drama"
                    }
                    duration={formatDuration(movie.durationMinutes)}
                    rating={movie.rating || "8.5"}
                    ageRating={movie.ageRating || "T13"}
                    posterUrl={getPosterUrl(movie, index)}
                    trailerUrl={movie.trailerUrl}
                    status={cardStatus}
                    releaseText={
                      movie.releaseDate
                        ? `Releases ${new Date(movie.releaseDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}`
                        : "Release date coming soon"
                    }
                    className="w-full"
                    onBook={() => navigate(getMovieDetailPath(movie))}
                    onOpenDetails={() => navigate(getMovieDetailPath(movie))}
                  />
                );
              })}
          </section>
        )}
      </main>
    </div>
  );
}

function toDisplayStatus(statusFilter) {
  return statusFilter === "coming-soon" ? "COMING_SOON" : "SHOWING_NOW";
}
