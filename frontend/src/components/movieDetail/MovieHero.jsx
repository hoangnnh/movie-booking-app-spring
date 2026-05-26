import { Bookmark, Check, PlayCircle } from "lucide-react";
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
  onPlayTrailer,
  trailerAvailable = false,
  onToggleFavorite,
  favoriteButtonLabel = "Add to Favorites",
  favoriteActive = false,
  favoriteDisabled = false,
}) {
  return (
    <section className="ticketor-container pt-[32px]">
      <div className="relative overflow-hidden rounded-card border border-app-border bg-app-background">
        <div className="absolute inset-x-0 top-0 h-[300px]">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={movie.title}
              className="h-full w-full object-cover opacity-50"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-app-surface via-app-background to-app-surface" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-app-background/80 to-app-background" />
        </div>

        <div className="relative z-10 p-[40px]">
          <h1 className="type-h2 mb-[24px] uppercase text-app-text">
            {movie.title}
          </h1>

          <div className="grid grid-cols-12 gap-[24px]">
            <div className="col-span-4">
              <div className="h-[420px] overflow-hidden rounded-card bg-app-surface">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-[24px] text-center type-h5 text-app-text-muted">
                    Poster unavailable
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-8">
              <div className="relative h-[420px] overflow-hidden rounded-card bg-app-surface">
                {backdropUrl ? (
                  <img
                    src={backdropUrl}
                    alt={`${movie.title} trailer`}
                    className="h-full w-full object-cover opacity-80"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-neutral-900 via-app-surface to-neutral-800" />
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <button
                    type="button"
                    onClick={onPlayTrailer}
                    disabled={!trailerAvailable}
                    aria-label={
                      trailerAvailable
                        ? `Play trailer for ${movie.title}`
                        : `Trailer unavailable for ${movie.title}`
                    }
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-app-background/80 text-brand transition-colors hover:bg-brand hover:text-neutral-900 disabled:cursor-not-allowed disabled:bg-app-background/55 disabled:text-app-text-subtle"
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

              <p className="type-body-s mt-[12px] text-app-text-subtle">
                {trailerAvailable
                  ? "Watch the latest trailer before booking your seat."
                  : "Trailer is not available for this movie yet."}
              </p>
            </div>

            <div className="flex items-center gap-[12px]">
              <Button size={40} variant="primary" onClick={onGetTicket}>
                Get Ticket
              </Button>

              <Button
                size={40}
                variant={favoriteActive ? "primary" : "outline"}
                tone={favoriteActive ? "brand" : "base"}
                leftIcon={favoriteActive ? <Check /> : <Bookmark />}
                onClick={onToggleFavorite}
                disabled={favoriteDisabled}
              >
                {favoriteButtonLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
