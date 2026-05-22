import { cn } from "../../utils/cn";

const toneMap = {
  info: "bg-secondary-700 text-neutral-900",
  brand: "bg-primary-500 text-neutral-900",
  error: "bg-error-400 text-neutral-900",
  muted: "bg-app-surface text-app-text",
};

const sizeMap = {
  sm: "h-[40px] w-[40px] type-h6",
  md: "h-[56px] w-[56px] type-h5",
  lg: "h-[88px] w-[88px] type-h3",
};

export default function ScoreBadge({
  value = "9",
  tone = "info",
  size = "sm",
  className = "",
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-tk-4 font-bold",
        toneMap[tone] || toneMap.info,
        sizeMap[size] || sizeMap.sm,
        className
      )}
    >
      {value}
    </div>
  );
}