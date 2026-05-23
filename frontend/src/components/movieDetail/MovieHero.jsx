import { Bookmark, PlayCircle } from "lucide-react";
import Button from "../common/Button";
import RatingBadge from "../common/RatingBadge";

export default function MovieHero({
  movie,
  posterUrl,
  backdropUrl,
  duration,
  genres,
  rating = "7.9",
  ageRating = "PG",
  onGetTicket,
}) {
  return (
    <section className="ticketor-container pt-[32px]">
      <div className="relative overflow-hidden rounded-card border border-app-border bg-app-background">
        <div className="absolute inset-x-0 top-0 h-[300px]">
          <img
            src={backdropUrl}
            alt={movie.title}
            className="h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-app-background/80 to-app-background" />
        </div>

        <div className="relative z-10 p-[40px]">
          <h1 className="type-h2 mb-[24px] uppercase text-app-text">
            {movie.title}
          </h1>

          <div className="grid grid-cols-12 gap-[24px]">
            <div className="col-span-4">
              <div className="h-[420px] overflow-hidden rounded-card bg-app-surface">
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="col-span-8">
              <div className="relative h-[420px] overflow-hidden rounded-card bg-app-surface">
                <img
                  src={backdropUrl}
                  alt={`${movie.title} trailer`}
                  className="h-full w-full object-cover opacity-80"
                />

                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <button
                    type="button"
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-app-background/80 text-brand transition-colors hover:bg-brand hover:text-neutral-900"
                  >
                    <PlayCircle className="h-[40px] w-[40px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-[32px] flex items-center justify-between gap-[24px]">
            <div>
              <div className="flex items-center gap-[16px]">
                <p className="type-body-m text-app-text-muted">{duration}</p>
                <span className="rounded-tk-4 border border-app-border px-[8px] py-[4px] type-label-s text-app-text-muted">
                  {ageRating}
                </span>
                <RatingBadge value={rating} />
              </div>

              <p className="type-body-m mt-[8px] text-app-text-muted">
                {genres}
              </p>
            </div>

            <div className="flex items-center gap-[12px]">
              <Button size={40} variant="primary" onClick={onGetTicket}>
                Get Ticket
              </Button>

              <Button
                size={40}
                variant="outline"
                tone="base"
                leftIcon={<Bookmark />}
              >
                Add to Favorites
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}