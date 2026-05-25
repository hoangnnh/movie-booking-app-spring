import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import MovieCard from "../components/movie/MovieCard";
import { movieApi } from "../api/api";
import { formatDuration, getPosterUrl, isComingSoon } from "../components/home/homeUtils";

const PAGE_SIZE = 12;

export default function MoviesPage() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [page, setPage] = useState(1);

  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    async function loadMovies() {
      try {
        setLoading(true);
        setError("");
        const data = await movieApi.getAll();
        setMovies(Array.isArray(data) ? data : []);
      } catch {
        setError("Cannot load movies from server.");
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, []);

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
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();

    return movies.filter((movie) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        movie.title?.toLowerCase().includes(normalizedSearch) ||
        movie.description?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "released" && !isComingSoon(movie)) ||
        (statusFilter === "coming-soon" && isComingSoon(movie));

      const matchesGenre =
        genreFilter === "all" ||
        (Array.isArray(movie.genres) && movie.genres.includes(genreFilter));

      return matchesSearch && matchesStatus && matchesGenre;
    });
  }, [movies, deferredSearchTerm, statusFilter, genreFilter]);

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
        <section className="overflow-hidden rounded-tk-12 border border-app-border bg-[radial-gradient(circle_at_top_left,_rgba(251,251,30,0.18),_transparent_30%),linear-gradient(135deg,_rgba(53,53,65,1),_rgba(20,20,24,1))] px-[28px] py-[32px]">
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
              {movies.length} total movies
            </div>
            <div className="rounded-full border border-app-border bg-black/20 px-[14px] py-[8px] type-body-s">
              {filteredMovies.length} matching now
            </div>
          </div>
        </section>

        <section className="mt-[28px] rounded-tk-12 border border-app-border bg-app-surface p-[20px]">
          <div className="grid gap-[16px] md:grid-cols-[minmax(0,2fr)_180px_180px]">
            <label className="grid gap-[6px]">
              <span className="type-body-xs text-app-text-muted">Search</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by title or description"
                className="h-[48px] rounded-tk-8 border border-app-border bg-app-background px-[16px] type-body-m text-app-text outline-none transition-colors placeholder:text-app-text-muted focus:border-brand"
              />
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
