import { cn } from "../../utils/cn";

const sizeMap = {
  small: {
    wrapper: "h-[64px] w-[48px]",
    day: "type-label-s",
    date: "type-h6",
    month: "type-label-s",
  },
  large: {
    wrapper: "h-[80px] w-[56px]",
    day: "type-label-s",
    date: "type-h5",
    month: "type-label-s",
  },
};

export default function DateChip({
  day = "TUE",
  date = "08",
  month = "JUL",
  size = "large",
  selected = false,
  disabled = false,
  showMonth,
  onClick,
  className = "",
}) {
  const selectedSize = sizeMap[size] || sizeMap.large;
  const shouldShowMonth = showMonth ?? size === "large";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-tk-4 border transition-colors",
        selectedSize.wrapper,
        selected
          ? "border-primary-600 bg-primary-600 text-neutral-900"
          : "border-app-border bg-app-background text-app-text hover:border-primary-600 hover:text-primary-600",
        disabled &&
          "cursor-not-allowed border-neutral-600 bg-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-500",
        className
      )}
    >
      <span className={selectedSize.day}>{day}</span>
      <span className={cn(selectedSize.date, "leading-none")}>{date}</span>

      {shouldShowMonth && (
        <span className={selectedSize.month}>{month}</span>
      )}
    </button>
  );
}