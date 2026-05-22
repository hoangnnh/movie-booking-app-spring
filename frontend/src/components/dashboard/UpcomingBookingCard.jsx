import { MapPin, Ticket } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/cn";

export default function UpcomingBookingCard({
  posterUrl = "",
  movieTitle = "F1 The Movie",
  dateTime = "Tuesday, July 8. 10:30",
  cinemaName = "Regal Gallery Place",
  seats = "4 Tickets - Seat B6, B7, B8, B9",
  onViewDetails,
  className = "",
}) {
  return (
    <article
      className={cn(
        "flex items-center justify-between gap-[24px]",
        "rounded-tk-8 border border-app-border bg-app-background p-[16px]",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-[16px]">
        <div className="h-[72px] w-[56px] shrink-0 overflow-hidden rounded-tk-4 bg-app-surface">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movieTitle}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-neutral-700" />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="type-h6 truncate text-app-text">{movieTitle}</h3>
          <p className="type-body-xs mt-[4px] text-app-text-muted">
            {dateTime}
          </p>
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 lg:block">
        <div className="flex items-center gap-[6px] text-app-text-muted">
          <MapPin className="h-[14px] w-[14px]" />
          <span className="type-body-xs truncate">{cinemaName}</span>
        </div>

        <div className="mt-[6px] flex items-center gap-[6px] text-app-text-muted">
          <Ticket className="h-[14px] w-[14px]" />
          <span className="type-body-xs truncate">{seats}</span>
        </div>
      </div>

      <Button size={28} variant="outline" tone="base" onClick={onViewDetails}>
        View Details
      </Button>
    </article>
  );
}