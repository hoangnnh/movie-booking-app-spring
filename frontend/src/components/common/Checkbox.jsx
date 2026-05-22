import { Check } from "lucide-react";
import { cn } from "../../utils/cn";

const sizeMap = {
    16: {
        box: "h-[16px] w-[16px]",
        icon: "h-[12px] w-[12px]",
    },
    20: {
        box: "h-[20px] w-[20px]",
        icon: "h-[14px] w-[14px]",
    },
    24: {
        box: "h-[24px] w-[24px]",
        icon: "h-[16px] w-[16px]",
    },
};

export default function Checkbox({
    checked = false,
    onChange,
    label,
    size = 16,
    disabled = false,
    error = false,
    className = "",
}) {
    const selectedSize = sizeMap[size] || sizeMap[16];

    return (
        <label
            className={cn(
                "inline-flex items-center gap-[8px]",
                disabled ? "cursor-not-allowed" : "cursor-pointer",
                className
            )}
        >
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange?.(event.target.checked)}
                className="sr-only"
            />

            <span
                className={cn(
                    "flex shrink-0 items-center justify-center rounded-[2px] border transition-colors",
                    selectedSize.box,
                    checked
                        ? "border-primary-600 bg-primary-600 text-neutral-900"
                        : "border-app-text-muted bg-transparent text-transparent",
                    error && !checked && "border-error-500",
                    disabled &&
                    "border-neutral-500 bg-neutral-700 text-neutral-500"
                )}
            >
                {checked && <Check className={selectedSize.icon} strokeWidth={3} />}
            </span>

            {label && (
                <span
                    className={cn(
                        "type-label-s",
                        error ? "text-error-500" : "text-app-text-muted",
                        disabled && "text-neutral-500"
                    )}
                >
                    {label}
                </span>
            )}
        </label>
    );
}