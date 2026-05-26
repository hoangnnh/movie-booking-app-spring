import { cn } from "../../utils/cn";

const sizeClasses = {
    28: {
        button: "h-[28px] gap-[8px] px-[12px] type-button-s",
        iconOnly: "h-[28px] w-[28px]",
        icon: "h-[16px] w-[16px]",
    },
    32: {
        button: "h-[32px] gap-[8px] px-[16px] type-button-m",
        iconOnly: "h-[32px] w-[32px]",
        icon: "h-[18px] w-[18px]",
    },
    40: {
        button: "h-[40px] gap-[8px] px-[20px] type-button-m",
        iconOnly: "h-[40px] w-[40px]",
        icon: "h-[20px] w-[20px]",
    },
    48: {
        button: "h-[48px] gap-[12px] px-[24px] type-button-l",
        iconOnly: "h-[48px] w-[48px]",
        icon: "h-[22px] w-[22px]",
    },
    56: {
        button: "h-[56px] gap-[12px] px-[32px] type-button-xl",
        iconOnly: "h-[56px] w-[56px]",
        icon: "h-[24px] w-[24px]",
    },
};

const variantClasses = {
    primary: {
        brand:
            "border border-primary-600 bg-primary-600 text-neutral-900 hover:border-primary-500 hover:bg-primary-500 active:border-primary-400 active:bg-primary-400 disabled:border-neutral-400 disabled:bg-neutral-300 disabled:text-neutral-500",
        base:
            "border border-app-text bg-app-text text-app-background hover:opacity-90 active:opacity-80 disabled:border-app-border disabled:bg-app-border disabled:text-app-text-subtle",
    },

    outline: {
        brand:
            "border border-primary-600 bg-transparent text-primary-600 hover:border-primary-500 hover:text-primary-500 active:border-primary-400 active:text-primary-400 disabled:border-neutral-500 disabled:text-neutral-500",
        base:
            "border border-app-border bg-transparent text-app-text hover:border-app-text hover:bg-app-surface-soft active:border-app-text active:text-app-text disabled:border-app-border disabled:text-app-text-subtle",
    },

    text: {
        brand:
            "border border-transparent bg-transparent text-primary-600 hover:text-primary-500 active:text-primary-400 disabled:text-neutral-500",
        base:
            "border border-transparent bg-transparent text-app-text hover:text-brand active:text-brand-hover disabled:text-app-text-subtle",
    },
};

export default function Button({
    children,
    type = "button",
    variant = "primary",
    size = 40,
    tone = "brand",
    leftIcon,
    rightIcon,
    iconOnly = false,
    disabled = false,
    className = "",
    ...props
}) {
    const selectedSize = sizeClasses[size] || sizeClasses[40];
    const selectedVariant =
        variantClasses[variant]?.[tone] || variantClasses.primary.brand;

    return (
        <button
            type={type}
            disabled={disabled}
            aria-label={iconOnly && typeof children === "string" ? children : undefined}
            className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-button transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-background",
                "disabled:cursor-not-allowed disabled:hover:opacity-100",
                iconOnly ? selectedSize.iconOnly : selectedSize.button,
                selectedVariant,
                className
            )}
            {...props}
        >
            {leftIcon && (
                <span className={cn("inline-flex items-center justify-center", selectedSize.icon)}>
                    {leftIcon}
                </span>
            )}

            {!iconOnly && children && <span>{children}</span>}

            {rightIcon && (
                <span className={cn("inline-flex items-center justify-center", selectedSize.icon)}>
                    {rightIcon}
                </span>
            )}

            {iconOnly && !leftIcon && !rightIcon && children}
        </button>
    );
}
