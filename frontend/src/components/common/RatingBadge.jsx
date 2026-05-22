import { Star } from "lucide-react";
import { cn } from "../../utils/cn";

const sizeMap = {
  sm: {
    wrapper: "h-[24px] gap-[4px]",
    icon: "h-[12px] w-[12px]",
    text: "type-body-xs",
  },
  md: {
    wrapper: "h-[32px] gap-[6px]",
    icon: "h-[16px] w-[16px]",
    text: "type-body-s",
  },
};

const toneMap = {
  brand: {
    icon: "fill-brand text-brand",
    text: "text-app-text",
  },
  base: {
    icon: "fill-app-text text-app-text",
    text: "text-app-text",
  },
  muted: {
    icon: "fill-app-text-muted text-app-text-muted",
    text: "text-app-text-muted",
  },
};

export default function RatingBadge({
  value = "7.9",
  size = "sm",
  tone = "brand",
  className = "",
}) {
  const selectedSize = sizeMap[size] || sizeMap.sm;
  const selectedTone = toneMap[tone] || toneMap.brand;

  return (
    <div
      className={cn(
        "inline-flex items-center",
        selectedSize.wrapper,
        className
      )}
    >
      <Star className={cn(selectedSize.icon, selectedTone.icon)} />
      <span className={cn(selectedSize.text, selectedTone.text)}>{value}</span>
    </div>
  );
}