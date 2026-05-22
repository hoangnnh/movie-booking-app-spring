import { Clock, Star } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/cn";

export default function CompactMovieCard({
  title = "The Dark Knight",
  posterUrl = "",
  duration = "2h 2m",
  rating = "8.5",
  ageRating = "PG-13",
  onGetTicket,
  className = "",
}) {
  return (
    <article
      className={cn(
        "group w-[156px] overflow-hidden bg-app-background text-app-text",
        className
      )}
    >
      <div className="relative h-[210px] w-full overflow-hidden bg-neutral-700">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-700 text-app-text-muted">
            No Poster
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />
      </div>

      <div className="pt-[8px]">
        <div className="flex items-start justify-between gap-[8px]">
          <h3 className="type-body-s truncate text-app-text">{title}</h3>

          <div className="flex shrink-0 items-center gap-[4px]">
            <Star className="h-[12px] w-[12px] fill-brand text-brand" />
            <span className="type-body-xs text-app-text">{rating}</span>
          </div>
        </div>

        <div className="mt-[6px] flex items-center justify-between">
          <div className="flex items-center gap-[4px] text-app-text-muted">
            <Clock className="h-[12px] w-[12px]" />
            <span className="type-body-xs">{duration}</span>
          </div>

          <span className="rounded-tk-4 border border-app-border px-[6px] py-[2px] type-body-xs text-app-text-muted">
            {ageRating}
          </span>
        </div>

        <div className="mt-[8px] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            size={28}
            variant="primary"
            className="w-full"
            onClick={onGetTicket}
          >
            Get Ticket
          </Button>
        </div>
      </div>
    </article>
  );
}