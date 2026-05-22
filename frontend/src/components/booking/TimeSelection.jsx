import { ChevronRight, MapPin } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/cn";

export function DateChip({
  day = "TUE",
  date = "08",
  month = "JUL",
  selected = false,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-[80px] w-[56px] flex-col items-center justify-center rounded-tk-4 border transition-colors",
        selected
          ? "border-primary-600 bg-primary-600 text-neutral-900"
          : "border-app-border bg-app-background text-app-text hover:border-primary-600 hover:text-primary-600",
        disabled &&
          "cursor-not-allowed border-neutral-600 bg-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-500"
      )}
    >
      <span className="type-label-s">{day}</span>
      <span className="type-h5 leading-none">{date}</span>
      <span className="type-label-s">{month}</span>
    </button>
  );
}

export function TimeChip({
  time = "3:10 PM",
  selected = false,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-[32px] min-w-[72px] rounded-tk-4 border px-[12px] type-label-s transition-colors",
        selected
          ? "border-primary-600 bg-primary-600 text-neutral-900"
          : "border-app-border bg-app-background text-app-text hover:border-primary-600 hover:text-primary-600",
        disabled &&
          "cursor-not-allowed border-neutral-600 bg-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-500"
      )}
    >
      {time}
    </button>
  );
}

export default function TimeSelection({
  cinemaName = "Regal Gallery Place",
  address = "701 Seventh Street Northwest, Washington, DC",
  distance = "0.20 mi",
  format = "Digital 3D",
  features = [
    "Reserved seating",
    "Closed caption",
    "Accessibility devices available",
  ],
  showtimes = [],
  selectedShowtimeId,
  onSelectShowtime,
  onContinue,
  disabled = false,
  className = "",
}) {
  const hasSelectedTime = Boolean(selectedShowtimeId);

  return (
    <article
      className={cn(
        "rounded-tk-8 border border-app-border bg-app-surface p-[24px]",
        disabled && "opacity-60",
        className
      )}
    >
      <div className="flex items-start justify-between gap-[24px]">
        <div>
          <h3 className="type-h6 text-app-text">{cinemaName}</h3>

          <div className="mt-[4px] flex items-center gap-[6px] text-secondary-600">
            <MapPin className="h-[14px] w-[14px]" />
            <p className="type-body-xs">{address}</p>
          </div>
        </div>

        <span className="type-body-xs text-app-text-muted">{distance}</span>
      </div>

      <div className="mt-[32px]">
        <h4 className="type-h6 text-app-text">{format}</h4>

        <p className="type-body-xs mt-[4px] text-app-text-muted">
          {features.join(" · ")}
        </p>

        <div className="mt-[16px] flex flex-wrap gap-[8px]">
          {showtimes.map((showtime) => (
            <TimeChip
              key={showtime.id}
              time={showtime.time}
              selected={selectedShowtimeId === showtime.id}
              disabled={disabled || showtime.disabled}
              onClick={() => onSelectShowtime?.(showtime.id)}
            />
          ))}
        </div>
      </div>

      <div className="mt-[24px] flex justify-end">
        <Button
          size={32}
          variant="primary"
          rightIcon={<ChevronRight />}
          disabled={disabled || !hasSelectedTime}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </article>
  );
}