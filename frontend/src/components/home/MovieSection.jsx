import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../common/Button";
import MovieCard from "../movie/MovieCard";
import SectionHeader from "./SectionHeader";
import { normalizeMovie } from "./homeUtils";
import { cn } from "../../utils/cn";

export default function MovieSection({
  title,
  description,
  movies = [],
  status = "released",
  limit = 5,
}) {
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  const visibleMovies = movies.slice(0, limit).map(normalizeMovie);

  if (visibleMovies.length === 0) return null;

  function scrollCarousel(direction) {
    const carousel = carouselRef.current;

    if (!carousel) return;

    const cardWidth = carousel.querySelector("article")?.offsetWidth || 220;
    carousel.scrollBy({
      left: direction * (cardWidth * 3 + 48),
      behavior: "smooth",
    });
  }

  return (
    <section className="ticketor-container py-[56px]">
      <SectionHeader
        title={title}
        description={description}
        onAction={() => navigate("/movies")}
      />

      <div className="relative">
        <div
          ref={carouselRef}
          className={cn(
            "flex snap-x snap-mandatory gap-[24px] overflow-x-auto pb-[12px] scroll-smooth",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          {visibleMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              title={movie.title}
              genres={movie.genres}
              duration={movie.duration}
              rating={movie.rating}
              ageRating={movie.ageRating}
              posterUrl={movie.posterUrl}
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
              className="w-[220px] snap-start"
              onBook={() => navigate(`/movies/${movie.id}`)}
              onTrailer={() => alert("Trailer feature will be added later.")}
            />
          ))}
        </div>

        {visibleMovies.length > 5 && (
          <div className="mt-[20px] flex justify-end gap-[8px]">
            <Button
              size={40}
              variant="outline"
              tone="brand"
              iconOnly
              rightIcon={<ChevronLeft />}
              onClick={() => scrollCarousel(-1)}
            />

            <Button
              size={40}
              variant="primary"
              iconOnly
              rightIcon={<ChevronRight />}
              onClick={() => scrollCarousel(1)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
