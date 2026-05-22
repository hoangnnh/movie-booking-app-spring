import MovieCard from "../components/movie/MovieCard";
import CompactMovieCard from "../components/movie/CompactMovieCard";
import PromotionCard from "../components/movie/PromotionCard";

const poster =
  "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop";

const promo =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop";

export default function CardsPreview() {
  return (
    <div className="min-h-screen bg-app-background p-[48px] text-app-text">
      <div className="flex flex-col gap-[48px]">
        <section>
          <h1 className="type-h4 mb-[24px]">Movie Cards</h1>

          <div className="flex items-start gap-[32px]">
            <MovieCard
              posterUrl={poster}
              title="The Dark Knight"
              genres="Action, Drama"
              duration="2h 2m"
              rating="8.5"
              ageRating="PG-13"
              status="released"
              onBook={() => alert("Book Now")}
              onTrailer={() => alert("Watch Trailer")}
            />

            <MovieCard
              posterUrl={poster}
              title="The Dark Knight"
              genres="Action, Drama"
              duration="2h 2m"
              rating="8.5"
              ageRating="PG-13"
              status="coming-soon"
              releaseText="Releases March 15, 2025"
              onTrailer={() => alert("Watch Trailer")}
            />
          </div>
        </section>

        <section>
          <h2 className="type-h4 mb-[24px]">Compact Movie Cards</h2>

          <div className="flex items-start gap-[32px]">
            <CompactMovieCard
              posterUrl={poster}
              title="The Dark Knight"
              duration="2h 2m"
              rating="8.5"
              ageRating="PG-13"
              onGetTicket={() => alert("Get Ticket")}
            />

            <CompactMovieCard
              posterUrl={poster}
              title="The Dark Knight"
              duration="2h 2m"
              rating="8.5"
              ageRating="PG-13"
              onGetTicket={() => alert("Get Ticket")}
            />
          </div>
        </section>

        <section>
          <h2 className="type-h4 mb-[24px]">Promotion Card</h2>

          <div className="max-w-[560px]">
            <PromotionCard
              imageUrl={promo}
              badge="Limit Time"
              title="Student Discount"
              description="50% Off All Weekday Matinee Show"
              onClick={() => alert("Learn More")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}