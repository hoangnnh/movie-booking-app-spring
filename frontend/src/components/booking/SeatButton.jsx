import { cn } from "../../utils/cn";

const sizeMap = {
  theater: "h-[16px] w-[18px]",
  sm: "h-[28px] w-[28px] type-label-s",
  md: "h-[36px] w-[36px] type-label-s",
  lg: "h-[44px] w-[44px] type-body-s",
};

const statusMap = {
  available:
    "border-app-border bg-app-background text-app-text hover:border-primary-600 hover:text-primary-600",
  selected:
    "border-primary-600 bg-primary-600 text-neutral-900",
  booked:
    "cursor-not-allowed border-neutral-600 bg-neutral-700 text-neutral-500",
  disabled:
    "cursor-not-allowed border-neutral-600 bg-neutral-700 text-neutral-500",
};

const theaterStatusMap = {
  available: "border-transparent bg-transparent text-[#f4f1df] hover:border-transparent hover:text-primary-600",
  selected: "border-transparent bg-transparent text-primary-600 hover:border-transparent",
  booked: "cursor-not-allowed border-transparent bg-transparent text-[#59590a]",
  disabled: "cursor-not-allowed border-transparent bg-transparent text-neutral-600",
};

export default function SeatButton({
  label = "A1",
  status = "available", // available | selected | booked | disabled
  size = "md",
  onClick,
  className = "",
  hideLabel = false,
}) {
  const isDisabled = status === "booked" || status === "disabled";

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-tk-4 border transition-colors",
        size === "theater" && "rounded-[3px]",
        sizeMap[size] || sizeMap.md,
        size === "theater"
          ? theaterStatusMap[status] || theaterStatusMap.available
          : statusMap[status] || statusMap.available,
        className
      )}
      aria-label={`Seat ${label}, ${status}`}
    >
      {!hideLabel && <span>{label}</span>}

      {size === "theater" ? (
        <>
          <span className="absolute left-[3px] right-[3px] top-[2px] h-[9px] rounded-t-[3px] bg-current" />
          <span className="absolute bottom-[2px] left-[2px] right-[2px] h-[4px] rounded-b-[2px] border-b-2 border-l-2 border-r-2 border-current" />
          <span className="absolute bottom-[3px] left-[-2px] h-[7px] w-[3px] rounded-l-[2px] bg-current" />
          <span className="absolute bottom-[3px] right-[-2px] h-[7px] w-[3px] rounded-r-[2px] bg-current" />
        </>
      ) : (
        <span
          className={cn(
            "absolute left-1/2 top-[4px] h-[3px] w-[60%] -translate-x-1/2 rounded-full",
            status === "selected"
              ? "bg-neutral-900/40"
              : status === "available"
                ? "bg-app-border"
                : "bg-neutral-500"
          )}
        />
      )}
    </button>
  );
}
