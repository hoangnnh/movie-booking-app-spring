import { cn } from "../../utils/cn";

const sizeMap = {
  sm: "h-[28px] min-w-[64px] px-[10px] type-label-s",
  md: "h-[32px] min-w-[72px] px-[12px] type-label-s",
  lg: "h-[40px] min-w-[88px] px-[16px] type-button-s",
};

export default function TimeChip({
  time = "3:10 PM",
  size = "md",
  selected = false,
  disabled = false,
  onClick,
  className = "",
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-tk-4 border text-center transition-colors",
        sizeMap[size] || sizeMap.md,
        selected
          ? "border-primary-600 bg-primary-600 text-neutral-900"
          : "border-app-border bg-app-background text-app-text hover:border-primary-600 hover:text-primary-600",
        disabled &&
          "cursor-not-allowed border-neutral-600 bg-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-500",
        className
      )}
    >
      {time}
    </button>
  );
}