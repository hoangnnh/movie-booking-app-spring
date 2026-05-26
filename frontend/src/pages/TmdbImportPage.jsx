import { useState } from "react";
import { Check, Database, Download, Layers, Search } from "lucide-react";
import { tmdbApi } from "../api/api";
import Button from "../components/common/Button";

export default function TmdbImportPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importedIds, setImportedIds] = useState([]);
  const [bulkList, setBulkList] = useState("now_playing");
  const [bulkPages, setBulkPages] = useState(1);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [homeSectionsLoading, setHomeSectionsLoading] = useState(false);

  async function searchMovies(event) {
    event.preventDefault();

    if (!query.trim()) return;

    try {
      setLoading(true);
      setError("");
      const data = await tmdbApi.searchMovies(query.trim());
      setResults(data.results || []);
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  }

  async function importMovie(tmdbId) {
    try {
      setError("");
      await tmdbApi.importMovie(tmdbId);
      setImportedIds((current) =>
        current.includes(tmdbId) ? current : [...current, tmdbId]
      );
    } catch (err) {
      setError(cleanError(err));
    }
  }

  async function importMovieList() {
    try {
      setBulkLoading(true);
      setBulkMessage("");
      setError("");

      const data = await tmdbApi.importMovieList({
        list: bulkList,
        pages: bulkPages,
      });

      setBulkMessage(
        `Imported ${data.importedCount} movie${data.importedCount === 1 ? "" : "s"} from ${formatListName(data.list)}.`
      );
      setImportedIds((current) => {
        const ids = (data.movies || [])
          .map((movie) => movie.tmdbId)
          .filter(Boolean);

        return Array.from(new Set([...current, ...ids]));
      });
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setBulkLoading(false);
    }
  }

  async function importHomeSections() {
    try {
      setHomeSectionsLoading(true);
      setBulkMessage("");
      setError("");

      const [nowPlaying, trendingWeek] = await Promise.all([
        tmdbApi.importMovieList({ list: "now_playing", pages: 1 }),
        tmdbApi.importMovieList({ list: "trending_week", pages: 1 }),
      ]);

      setBulkMessage(
        `Home sections refreshed: ${nowPlaying.importedCount} now playing and ${trendingWeek.importedCount} trending movies.`
      );
      setImportedIds((current) => {
        const ids = [nowPlaying, trendingWeek]
          .flatMap((data) => data.movies || [])
          .map((movie) => movie.tmdbId)
          .filter(Boolean);

        return Array.from(new Set([...current, ...ids]));
      });
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setHomeSectionsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[48px]">
        <div className="mb-[32px] flex items-center gap-[12px]">
          <span className="flex h-[40px] w-[40px] items-center justify-center rounded-tk-8 bg-app-surface text-brand">
            <Database className="h-[22px] w-[22px]" />
          </span>
          <div>
            <h1 className="type-h3 text-app-text">Admin Movie Dashboard</h1>
            <p className="type-body-s mt-[4px] text-app-text-muted">
              Import TMDB movies into your local catalog and refresh home page sections.
            </p>
          </div>
        </div>

        <form
          onSubmit={searchMovies}
          className="mb-[24px] flex gap-[12px] rounded-tk-8 border border-app-border bg-app-surface p-[16px]"
        >
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search movies, e.g. F1, Interstellar, John Wick"
              className="h-[48px] w-full rounded-tk-4 border border-app-border bg-app-background px-[16px] pr-[48px] type-body-m text-app-text outline-none transition-colors placeholder:text-app-text-muted focus:border-brand"
            />
            <Search className="absolute right-[16px] top-1/2 h-[20px] w-[20px] -translate-y-1/2 text-app-text-muted" />
          </div>

          <Button type="submit" size={48} disabled={loading || !query.trim()}>
            {loading ? "Searching" : "Search"}
          </Button>
        </form>

        <section className="mb-[32px] rounded-tk-8 border border-app-border bg-app-surface p-[16px]">
          <div className="mb-[16px] flex items-center gap-[10px]">
            <Layers className="h-[20px] w-[20px] text-brand" />
            <div>
              <h2 className="type-h5 text-app-text">Home Section Import</h2>
              <p className="type-body-xs text-app-text-muted">
                Refresh local home sections from TMDB once, then serve users from your database.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-[12px]">
            <Button
              size={40}
              leftIcon={<Download />}
              disabled={homeSectionsLoading || bulkLoading}
              onClick={importHomeSections}
            >
              {homeSectionsLoading ? "Refreshing" : "Refresh Home Sections"}
            </Button>

            <label className="grid gap-[6px]">
              <span className="type-body-xs text-app-text-muted">Movie list</span>
              <select
                value={bulkList}
                onChange={(event) => setBulkList(event.target.value)}
                className="h-[40px] min-w-[180px] rounded-tk-4 border border-app-border bg-app-background px-[12px] type-body-s text-app-text outline-none"
              >
                <option value="now_playing">Now Playing</option>
                <option value="trending_week">Trending This Week</option>
                <option value="popular">Popular</option>
                <option value="top_rated">Top Rated</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </label>

            <label className="grid gap-[6px]">
              <span className="type-body-xs text-app-text-muted">Pages</span>
              <select
                value={bulkPages}
                onChange={(event) => setBulkPages(Number(event.target.value))}
                className="h-[40px] min-w-[120px] rounded-tk-4 border border-app-border bg-app-background px-[12px] type-body-s text-app-text outline-none"
              >
                <option value={1}>1 page / 20 movies</option>
                <option value={2}>2 pages / 40 movies</option>
                <option value={3}>3 pages / 60 movies</option>
              </select>
            </label>

            <Button
              size={40}
              leftIcon={<Download />}
              disabled={bulkLoading || homeSectionsLoading}
              onClick={importMovieList}
            >
              {bulkLoading ? "Importing" : "Import List"}
            </Button>

            {bulkMessage && (
              <p className="type-body-s text-success-400">{bulkMessage}</p>
            )}
          </div>
        </section>

        {error && (
          <div className="mb-[24px] rounded-tk-8 border border-error-500 bg-app-background p-[16px] type-body-s text-error-500">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-[20px]">
          {results.map((movie) => {
            const imported = importedIds.includes(movie.tmdbId);

            return (
              <article
                key={movie.tmdbId}
                className="overflow-hidden rounded-tk-8 border border-app-border bg-app-surface"
              >
                <div className="aspect-[2/3] bg-neutral-700">
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center type-body-s text-app-text-muted">
                      No Poster
                    </div>
                  )}
                </div>

                <div className="p-[16px]">
                  <h2 className="type-h6 line-clamp-2 text-app-text">
                    {movie.title}
                  </h2>
                  <p className="type-body-xs mt-[4px] text-app-text-muted">
                    {movie.releaseDate || "Release date unknown"}
                  </p>

                  <p className="type-body-xs mt-[12px] line-clamp-3 min-h-[54px] text-app-text-muted">
                    {movie.overview || "No overview available."}
                  </p>

                  <Button
                    size={40}
                    variant={imported ? "outline" : "primary"}
                    tone={imported ? "brand" : "brand"}
                    leftIcon={imported ? <Check /> : <Download />}
                    disabled={imported}
                    className="mt-[16px] w-full"
                    onClick={() => importMovie(movie.tmdbId)}
                  >
                    {imported ? "Imported" : "Import"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && results.length === 0 && (
          <div className="rounded-tk-8 border border-app-border bg-app-surface p-[32px] text-center">
            <p className="type-body-m text-app-text-muted">
              Search for a movie to import from TMDB.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function formatListName(value) {
  return value
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function cleanError(error) {
  const message = error?.message || "TMDB request failed.";

  if (message.includes("TMDB API token is not configured")) {
    return "TMDB token is missing. Set TMDB_API_READ_ACCESS_TOKEN before starting the backend.";
  }

  return message;
}
