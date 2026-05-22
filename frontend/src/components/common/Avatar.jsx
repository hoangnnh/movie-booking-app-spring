import { User } from "lucide-react";
import { cn } from "../../utils/cn";

const sizeMap = {
  40: "h-[40px] w-[40px]",
  48: "h-[48px] w-[48px]",
  56: "h-[56px] w-[56px]",
  80: "h-[80px] w-[80px]",
  100: "h-[100px] w-[100px]",
};

const iconSizeMap = {
  40: "h-[20px] w-[20px]",
  48: "h-[24px] w-[24px]",
  56: "h-[28px] w-[28px]",
  80: "h-[40px] w-[40px]",
  100: "h-[48px] w-[48px]",
};

export default function Avatar({
  src,
  alt = "User avatar",
  size = 40,
  className = "",
}) {
  const sizeClass = sizeMap[size] || sizeMap[40];
  const iconSizeClass = iconSizeMap[size] || iconSizeMap[40];

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-full bg-neutral-700",
        "flex items-center justify-center",
        sizeClass,
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <User className={cn("text-neutral-300", iconSizeClass)} />
      )}
    </div>
  );
}