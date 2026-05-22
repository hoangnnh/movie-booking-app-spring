import { cn } from "../../utils/cn";

const sizeMap = {
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

export default function SeatButton({
  label = "A1",
  status = "available", // available | selected | booked | disabled
  size = "md",
  onClick,
  className = "",
}) {
  const isDisabled = status === "booked" || status === "disabled";

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-tk-4 border transition-colors",
        sizeMap[size] || sizeMap.md,
        statusMap[status] || statusMap.available,
        className
      )}
      aria-label={`Seat ${label}, ${status}`}
    >
      <span>{label}</span>

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
    </button>
  );
}