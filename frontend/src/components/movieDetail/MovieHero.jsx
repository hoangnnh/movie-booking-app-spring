import { PlayCircle } from "lucide-react";
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
  bookingAvailable = true,
}) {
  return (
    <section className="ticketor-container pt-[24px] sm:pt-[32px]">
      <div className="relative overflow-hidden rounded-card border border-app-border bg-app-background">
        <div className="absolute inset-x-0 top-0 h-[220px] sm:h-[300px]">
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

        <div className="relative z-10 p-[20px] sm:p-[28px] lg:p-[40px]">
          <h1 className="type-h2 mb-[20px] uppercase text-app-text sm:mb-[24px]">
            {movie.title}
          </h1>

          <div className="grid gap-[20px] lg:grid-cols-12 lg:gap-[24px]">
            <div className="lg:col-span-4">
              <div className="mx-auto h-[320px] max-w-[260px] overflow-hidden rounded-card bg-app-surface sm:h-[380px] lg:mx-0 lg:h-[420px] lg:max-w-none">
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

            <div className="lg:col-span-8">
              <div className="relative h-[240px] overflow-hidden rounded-card bg-app-surface sm:h-[320px] lg:h-[420px]">
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
                    className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-app-background/80 text-brand transition-colors hover:bg-brand hover:text-neutral-900 disabled:cursor-not-allowed disabled:bg-app-background/55 disabled:text-app-text-subtle sm:h-[72px] sm:w-[72px]"
                  >
                    <PlayCircle className="h-[34px] w-[34px] sm:h-[40px] sm:w-[40px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-[24px] flex flex-col gap-[20px] lg:mt-[32px] lg:flex-row lg:items-center lg:justify-between lg:gap-[24px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-[12px] sm:gap-[16px]">
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

            <div className="flex flex-col gap-[12px] sm:flex-row sm:items-center">
              {bookingAvailable ? (
                <Button size={40} variant="primary" className="w-full sm:w-auto" onClick={onGetTicket}>
                  Get Ticket
                </Button>
              ) : (
                <span className="rounded-tk-4 border border-app-border px-[16px] py-[10px] type-body-s text-app-text-muted">
                  Currently unavailable for booking
                </span>
              )}

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
