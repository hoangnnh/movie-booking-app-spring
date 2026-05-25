import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import MovieCard from "../components/movie/MovieCard";
import { movieApi } from "../api/api";
import { formatDuration, getPosterUrl, isComingSoon } from "../components/home/homeUtils";
import { useTheme } from "../context/useTheme";

const PAGE_SIZE = 12;

export default function MoviesPage() {
  const navigate = useNavigate();
  const { isLightMode } = useTheme();
  const [movies, setMovies] = useState([]);
  const [catalogCount, setCatalogCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [page, setPage] = useState(1);

  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    let ignore = false;

    async function loadMovies() {
      const normalizedSearch = deferredSearchTerm.trim();

      try {
        setLoading(true);
        setError("");
        const data =
          normalizedSearch.length === 0
            ? await movieApi.getAll()
            : await movieApi.search(normalizedSearch);

        if (ignore) {
          return;
        }

        const nextMovies = Array.isArray(data) ? data : [];
        setMovies(nextMovies);

        if (normalizedSearch.length === 0) {
          setCatalogCount(nextMovies.length);
        }
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
  }, [deferredSearchTerm]);

  useEffect(() => {
    let ignore = false;

    async function loadSuggestions() {
      const normalizedSearch = searchTerm.trim();

      if (normalizedSearch.length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const data = await movieApi.autocomplete(normalizedSearch);

        if (ignore) {
          return;
        }

        const nextSuggestions = Array.isArray(data) ? data : [];
        setSuggestions(nextSuggestions);
        setShowSuggestions(nextSuggestions.length > 0);
      } catch {
        if (!ignore) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    }

    loadSuggestions();

    return () => {
      ignore = true;
    };
  }, [searchTerm]);

  const availableGenres = useMemo(() => {
    return Array.from(
      new Set(
        movies.flatMap((movie) =>
          Array.isArray(movie.genres) ? movie.genres.filter(Boolean) : []
        )
      )
    ).sort((left, right) => left.localeCompare(right));
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "released" && !isComingSoon(movie)) ||
        (statusFilter === "coming-soon" && isComingSoon(movie));

      const matchesGenre =
        genreFilter === "all" ||
        (Array.isArray(movie.genres) && movie.genres.includes(genreFilter));

      return matchesStatus && matchesGenre;
    });
  }, [movies, statusFilter, genreFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [deferredSearchTerm, statusFilter, genreFilter]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const visibleMovies = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredMovies.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredMovies, page]);

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
          <p className="type-label-m text-brand">MOVIE CATALOG</p>
          <h1 className="type-h2 mt-[10px] max-w-[680px] text-app-text">
            Browse your full cinema lineup in one place.
          </h1>
          <p className="type-body-m mt-[12px] max-w-[720px] text-app-text-muted">
            Search across imported titles, filter by release status or genre,
            and open any movie directly to book showtimes.
          </p>

          <div className="mt-[24px] flex flex-wrap gap-[12px] text-app-text-muted">
            <div className="rounded-full border border-app-border bg-black/20 px-[14px] py-[8px] type-body-s">
              {catalogCount} total movies
            </div>
            <div className="rounded-full border border-app-border bg-black/20 px-[14px] py-[8px] type-body-s">
              {filteredMovies.length} matching now
            </div>
          </div>
        </section>

        <section className="mt-[28px] rounded-tk-12 border border-app-border bg-app-surface p-[20px]">
          <div className="grid gap-[16px] md:grid-cols-[minmax(0,2fr)_180px_180px]">
            <label className="relative grid gap-[6px]">
              <span className="type-body-xs text-app-text-muted">Search</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                onBlur={() => {
                  window.setTimeout(() => {
                    setShowSuggestions(false);
                  }, 120);
                }}
                placeholder="Search by title or description"
                className="h-[48px] rounded-tk-8 border border-app-border bg-app-background px-[16px] type-body-m text-app-text outline-none transition-colors placeholder:text-app-text-muted focus:border-brand"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] z-10 overflow-hidden rounded-tk-8 border border-app-border bg-app-surface shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                  {suggestions.map((movie) => (
                    <button
                      key={movie.id}
                      type="button"
                      onMouseDown={() => {
                        setSearchTerm(movie.title || "");
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-center justify-between gap-[16px] border-b border-app-border px-[16px] py-[12px] text-left transition-colors last:border-b-0 hover:bg-app-background"
                    >
                      <span className="type-body-s text-app-text">
                        {movie.title || "Untitled Movie"}
                      </span>
                      <span className="type-body-xs text-app-text-muted">
                        {movie.releaseDate
                          ? new Date(movie.releaseDate).getFullYear()
                          : "TBA"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </label>

            <label className="grid gap-[6px]">
              <span className="type-body-xs text-app-text-muted">Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-[48px] rounded-tk-8 border border-app-border bg-app-background px-[14px] type-body-s text-app-text outline-none transition-colors focus:border-brand"
              >
                <option value="all">All movies</option>
                <option value="released">Now playing</option>
                <option value="coming-soon">Coming soon</option>
              </select>
            </label>

            <label className="grid gap-[6px]">
              <span className="type-body-xs text-app-text-muted">Genre</span>
              <select
                value={genreFilter}
                onChange={(event) => setGenreFilter(event.target.value)}
                className="h-[48px] rounded-tk-8 border border-app-border bg-app-background px-[14px] type-body-s text-app-text outline-none transition-colors focus:border-brand"
              >
                <option value="all">All genres</option>
                {availableGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </label>
          </div>
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

        {!loading && !error && filteredMovies.length === 0 && (
          <div className="mt-[28px] rounded-tk-12 border border-app-border bg-app-surface p-[40px] text-center">
            <h2 className="type-h5 text-app-text">No movies match these filters.</h2>
            <p className="type-body-s mt-[8px] text-app-text-muted">
              Try a different search term, clear the genre filter, or import more
              titles from TMDB.
            </p>
            <div className="mt-[20px] flex justify-center gap-[12px]">
              <Button
                size={40}
                variant="outline"
                tone="brand"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setGenreFilter("all");
                }}
              >
                Reset Filters
              </Button>
              <Button size={40} onClick={() => navigate("/tmdb")}>
                Import Movies
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && filteredMovies.length > 0 && (
          <>
            <section className="mt-[28px] grid gap-x-[24px] gap-y-[32px] sm:grid-cols-2 lg:grid-cols-4">
              {visibleMovies.map((movie, index) => {
                const comingSoon = isComingSoon(movie);

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
                    ageRating={movie.ageRating || "PG-13"}
                    posterUrl={getPosterUrl(movie, index)}
                    status={comingSoon ? "coming-soon" : "released"}
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
                    onBook={() => navigate(`/movies/${movie.id}`)}
                    onTrailer={() => navigate(`/movies/${movie.id}`)}
                  />
                );
              })}
            </section>

            <section className="mt-[32px] flex flex-wrap items-center justify-between gap-[16px] rounded-tk-12 border border-app-border bg-app-surface p-[20px]">
              <p className="type-body-s text-app-text-muted">
                Showing {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, filteredMovies.length)} of{" "}
                {filteredMovies.length} movies
              </p>

              <div className="flex items-center gap-[8px]">
                <Button
                  size={40}
                  variant="outline"
                  tone="brand"
                  disabled={page === 1}
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                >
                  Previous
                </Button>
                <div className="rounded-full border border-app-border px-[14px] py-[10px] type-body-s text-app-text">
                  Page {page} / {totalPages}
                </div>
                <Button
                  size={40}
                  variant="primary"
                  disabled={page === totalPages}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
