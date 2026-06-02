import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "../movie/MovieCard";
import SectionHeader from "./SectionHeader";
import { normalizeMovie } from "./homeUtils";
import { getMovieDetailPath } from "../../utils/moviePath";

const MAX_VISIBLE_CARDS = 5;
const MIN_CARD_WIDTH = 190;
const CARD_GAP = 24;

export default function MovieSection({
  title,
  description,
  movies = [],
  status = "released",
  limit = 5,
}) {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);

  const visibleMovies = movies.slice(0, limit).map(normalizeMovie);
  const maxStartIndex = Math.max(0, visibleMovies.length - visibleCount);
  const renderedMovies = visibleMovies.slice(startIndex, startIndex + visibleCount);

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel) return undefined;

    function updateVisibleCount() {
      const nextVisibleCount = Math.min(
        MAX_VISIBLE_CARDS,
        visibleMovies.length,
        Math.max(
        1,
          Math.floor((carousel.clientWidth + CARD_GAP) / (MIN_CARD_WIDTH + CARD_GAP))
        )
      );

      setVisibleCount(nextVisibleCount);
      setStartIndex((current) =>
        Math.min(current, Math.max(0, visibleMovies.length - nextVisibleCount))
      );
    }

    updateVisibleCount();

    const resizeObserver = new ResizeObserver(updateVisibleCount);
    resizeObserver.observe(carousel);

    return () => resizeObserver.disconnect();
  }, [visibleMovies.length]);

  if (visibleMovies.length === 0) return null;

  return (
    <section className="ticketor-container py-[56px]">
      <SectionHeader
        title={title}
        description={description}
        onAction={() => {
          navigate(status === "coming-soon" ? "/movies/coming-soon" : "/movies/showing-now");
        }}
      />

      <div className="relative">
        {startIndex > 0 && (
          <button
            type="button"
            aria-label={`Show previous ${title.toLowerCase()} movie`}
            onClick={() => setStartIndex((current) => Math.max(0, current - 1))}
            className="absolute left-[-18px] top-[132px] z-10 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-error-600 text-white shadow-[0_8px_22px_rgba(0,0,0,0.32)] transition-colors hover:bg-error-500"
          >
            <ChevronLeft className="h-[34px] w-[34px]" />
          </button>
        )}

        <div
          ref={carouselRef}
          className="grid gap-[24px] overflow-hidden pb-[12px]"
          style={{
            gridTemplateColumns: `repeat(${renderedMovies.length}, minmax(0, 1fr))`,
          }}
        >
          {renderedMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              title={movie.title}
              genres={movie.genres}
              duration={movie.duration}
              rating={movie.rating}
              ageRating={movie.ageRating}
              posterUrl={movie.posterUrl}
              trailerUrl={movie.trailerUrl}
              status={status}
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
                  : "Releases March 15, 2025"
              }
              className="!w-full min-w-0"
              onBook={() => navigate(getMovieDetailPath(movie))}
              onOpenDetails={() => navigate(getMovieDetailPath(movie))}
            />
          ))}
        </div>

        {startIndex < maxStartIndex && (
          <button
            type="button"
            aria-label={`Show next ${title.toLowerCase()} movie`}
            onClick={() =>
              setStartIndex((current) => Math.min(maxStartIndex, current + 1))
            }
            className="absolute right-[-18px] top-[132px] z-10 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-error-600 text-white shadow-[0_8px_22px_rgba(0,0,0,0.32)] transition-colors hover:bg-error-500"
          >
            <ChevronRight className="h-[34px] w-[34px]" />
          </button>
        )}
      </div>
    </section>
  );
}
