import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/common/Button";
import MovieCard from "../components/movie/MovieCard";
import { movieApi } from "../api/api";
import {
  formatDuration,
  getPosterUrl,
  isComingSoon,
} from "../components/home/homeUtils";
import { getMovieDetailPath } from "../utils/moviePath";

export default function ActorMoviesPage() {
  const navigate = useNavigate();
  const { actorName } = useParams();
  const decodedActorName = decodeURIComponent(actorName || "");

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMovies() {
      try {
        setLoading(true);
        setError("");

        const data = await movieApi.getByActorName(decodedActorName);
        setMovies(Array.isArray(data) ? data : []);
      } catch {
        setError("Cannot load movies for this actor.");
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, [decodedActorName]);

  const actorMovies = useMemo(
    () =>
      movies.map((movie, index) => ({
        ...movie,
        posterUrl: getPosterUrl(movie, index),
        duration: formatDuration(movie.durationMinutes),
        comingSoon: isComingSoon(movie),
      })),
    [movies]
  );

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[48px]">
        <section className="rounded-tk-12 border border-app-border bg-app-surface p-[28px]">
          <Button
            size={40}
            variant="outline"
            tone="brand"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>

          <p className="type-label-m mt-[24px] text-brand">ACTOR FILMOGRAPHY</p>
          <h1 className="type-h2 mt-[10px] text-app-text">{decodedActorName}</h1>
          <p className="type-body-m mt-[12px] max-w-[720px] text-app-text-muted">
            Browse all imported movies in your cinema app that include this
            actor in the cast.
          </p>
        </section>

        {loading && (
          <div className="py-[56px]">
            <p className="type-body-m text-app-text-muted">
              Loading actor movies...
            </p>
          </div>
        )}

        {error && (
          <div className="py-[32px]">
            <div className="rounded-tk-8 border border-error-500 bg-app-background p-[16px] text-error-500">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && actorMovies.length === 0 && (
          <div className="mt-[28px] rounded-tk-12 border border-app-border bg-app-surface p-[40px] text-center">
            <h2 className="type-h5 text-app-text">
              No related movies found for {decodedActorName}.
            </h2>
            <p className="type-body-s mt-[8px] text-app-text-muted">
              This app only shows movies already imported into your database.
            </p>
          </div>
        )}

        {!loading && !error && actorMovies.length > 0 && (
          <section className="mt-[28px] grid gap-x-[24px] gap-y-[32px] sm:grid-cols-2 lg:grid-cols-4">
            {actorMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                title={movie.title || "Untitled Movie"}
                genres={
                  Array.isArray(movie.genres) && movie.genres.length > 0
                    ? movie.genres.join(", ")
                    : "Drama"
                }
                duration={movie.duration}
                rating={movie.rating || "8.5"}
                ageRating={movie.ageRating || "T13"}
                posterUrl={movie.posterUrl}
                trailerUrl={movie.trailerUrl}
                status={movie.comingSoon ? "coming-soon" : "released"}
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
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
