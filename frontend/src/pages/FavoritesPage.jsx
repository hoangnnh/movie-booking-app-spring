import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookmarkX } from "lucide-react";
import Button from "../components/common/Button";
import { favoritesApi } from "../api/api";
import { formatDuration, getPosterUrl } from "../components/home/homeUtils";
import { useAuth } from "../context/useAuth";

export default function FavoritesPage({ onRequireAuth }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingMovieId, setPendingMovieId] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadFavorites() {
      if (!isAuthenticated || !user?.userId) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await favoritesApi.getUserFavorites(user.userId);

        if (!ignore) {
          setFavorites(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!ignore) {
          setError("Cannot load your favorite movies right now.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadFavorites();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, user?.userId]);

  const favoriteCountLabel = useMemo(() => {
    return `${favorites.length} saved movie${favorites.length === 1 ? "" : "s"}`;
  }, [favorites]);

  async function handleRemoveFavorite(movieId) {
    if (!user?.userId) {
      return;
    }

    try {
      setPendingMovieId(movieId);
      await favoritesApi.removeFavorite(user.userId, movieId);
      setFavorites((currentFavorites) =>
        currentFavorites.filter((movie) => movie.id !== movieId)
      );
    } catch {
      setError("We couldn't remove that movie from favorites.");
    } finally {
      setPendingMovieId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="ticketor-container py-[72px]">
        <div className="rounded-card border border-app-border bg-app-surface p-[32px] text-center">
          <p className="type-label-m text-brand">FAVORITES</p>
          <h1 className="type-h4 mt-[12px] text-app-text">
            Sign in to view your saved movies.
          </h1>
          <p className="type-body-m mt-[12px] text-app-text-muted">
            Favorites are only available for signed-in users so your list stays
            tied to your account.
          </p>
          <div className="mt-[20px] flex justify-center">
            <Button size={40} onClick={onRequireAuth}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[48px]">
        <section className="rounded-tk-12 border border-app-border bg-app-surface p-[28px]">
          <p className="type-label-m text-brand">FAVORITES</p>
          <div className="mt-[10px] flex flex-wrap items-end justify-between gap-[16px]">
            <div>
              <h1 className="type-h3 text-app-text">My favorite movies</h1>
              <p className="type-body-m mt-[8px] text-app-text-muted">
                Keep a personal shortlist of movies you want to come back to.
              </p>
            </div>
            <div className="rounded-full border border-app-border px-[14px] py-[8px] type-body-s text-app-text-muted">
              {favoriteCountLabel}
            </div>
          </div>
        </section>

        {loading && (
          <div className="py-[48px]">
            <p className="type-body-m text-app-text-muted">
              Loading your favorites...
            </p>
          </div>
        )}

        {error && (
          <div className="mt-[24px] rounded-card border border-error-500 bg-app-background p-[16px] text-error-500">
            {error}
          </div>
        )}

        {!loading && !error && favorites.length === 0 && (
          <div className="mt-[28px] rounded-card border border-dashed border-app-border bg-app-surface p-[40px] text-center">
            <h2 className="type-h5 text-app-text">No favorites yet.</h2>
            <p className="type-body-s mt-[8px] text-app-text-muted">
              Save a movie from its detail page and it will show up here.
            </p>
            <div className="mt-[20px] flex justify-center">
              <Button size={40} onClick={() => navigate("/movies")}>
                Browse Movies
              </Button>
            </div>
          </div>
        )}

        {!loading && favorites.length > 0 && (
          <section className="mt-[28px] grid gap-[20px] md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((movie, index) => (
              <article
                key={movie.id}
                className="overflow-hidden rounded-card border border-app-border bg-app-surface"
              >
                <div className="grid gap-[18px] p-[18px] sm:grid-cols-[140px_minmax(0,1fr)]">
                  <Link to={`/movies/${movie.id}`} className="overflow-hidden rounded-tk-8 bg-app-background">
                    {getPosterUrl(movie, index) ? (
                      <img
                        src={getPosterUrl(movie, index)}
                        alt={movie.title}
                        className="aspect-[2/3] h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[2/3] items-center justify-center px-[16px] text-center type-body-s text-app-text-muted">
                        No poster
                      </div>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-col justify-between gap-[16px]">
                    <div>
                      <Link
                        to={`/movies/${movie.id}`}
                        className="type-h6 text-app-text transition-colors hover:text-brand"
                      >
                        {movie.title || "Untitled Movie"}
                      </Link>
                      <p className="type-body-xs mt-[6px] text-app-text-muted">
                        {Array.isArray(movie.genres) && movie.genres.length > 0
                          ? movie.genres.join(", ")
                          : "Genre coming soon"}
                      </p>
                      <p className="type-body-xs mt-[10px] text-app-text-muted">
                        {formatDuration(movie.durationMinutes)}
                      </p>
                      <p className="type-body-s mt-[12px] max-h-[96px] overflow-hidden text-app-text-muted">
                        {movie.description || "No description available yet."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-[10px]">
                      <Button
                        size={40}
                        variant="primary"
                        onClick={() => navigate(`/movies/${movie.id}`)}
                      >
                        View Movie
                      </Button>
                      <Button
                        size={40}
                        variant="outline"
                        tone="base"
                        leftIcon={<BookmarkX />}
                        disabled={pendingMovieId === movie.id}
                        onClick={() => handleRemoveFavorite(movie.id)}
                      >
                        {pendingMovieId === movie.id ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
