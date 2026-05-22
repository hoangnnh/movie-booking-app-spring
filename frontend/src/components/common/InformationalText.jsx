import { cn } from "../../utils/cn";

const toneMap = {
  default: "text-app-text-muted",
  error: "text-error-500",
  success: "text-success-500",
  warning: "text-danger-500",
  brand: "text-brand",
};

export default function InformationalText({
  children,
  tone = "default",
  rightText,
  onRightClick,
  showIndicator = true,
  className = "",
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-[16px]",
        "type-label-s",
        className
      )}
    >
      <div className={cn("flex min-w-0 items-center gap-[8px]", toneMap[tone])}>
        {showIndicator && (
          <span
            className={cn(
              "h-[12px] w-[12px] shrink-0 rounded-[2px] border",
              tone === "error"
                ? "border-error-500"
                : "border-app-text-muted"
            )}
          />
        )}

        <span className="truncate">{children}</span>
      </div>

      {rightText && (
        <button
          type="button"
          onClick={onRightClick}
          className="shrink-0 text-brand transition-colors hover:text-brand-hover"
        >
          {rightText}
        </button>
      )}
    </div>
  );
}