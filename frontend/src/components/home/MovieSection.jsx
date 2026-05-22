import { useNavigate } from "react-router-dom";
import MovieCard from "../movie/MovieCard";
import SectionHeader from "./SectionHeader";
import { normalizeMovie } from "./homeUtils";

export default function MovieSection({
  title,
  description,
  movies = [],
  status = "released",
  limit = 5,
}) {
  const navigate = useNavigate();

  const visibleMovies = movies.slice(0, limit).map(normalizeMovie);

  if (visibleMovies.length === 0) return null;

  return (
    <section className="ticketor-container py-[56px]">
      <SectionHeader
        title={title}
        description={description}
        onAction={() => navigate("/movies")}
      />

      <div className="flex gap-[24px] overflow-x-auto pb-[8px]">
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
            onBook={() => navigate(`/movies/${movie.id}`)}
            onTrailer={() => alert("Trailer feature will be added later.")}
          />
        ))}
      </div>
    </section>
  );
}