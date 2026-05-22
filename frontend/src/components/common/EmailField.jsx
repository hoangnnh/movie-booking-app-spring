import { useState } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { cn } from "../../utils/cn";
import InformationalText from "./InformationalText";

export default function EmailField({
  label,
  value,
  onChange,
  placeholder = "Email",
  type = "email",
  informationText = "Information Text",
  errorText = "",
  disabled = false,
  forgotText,
  onForgotClick,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;
  const hasError = Boolean(errorText);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="type-label-m mb-[8px] block text-app-text">
          {label}
        </label>
      )}

      <div
        className={cn(
          "flex h-[56px] items-center rounded-tk-4 border bg-app-background",
          "transition-colors",
          hasError
            ? "border-error-500"
            : "border-transparent focus-within:border-app-text",
          disabled && "border-neutral-500 bg-neutral-700"
        )}
      >
        <div
          className={cn(
            "ml-[16px] h-[32px] w-px shrink-0",
            hasError ? "bg-error-500" : "bg-app-text-muted"
          )}
        />

        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={inputType}
          disabled={disabled}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent px-[12px]",
            "type-body-m text-app-text placeholder:text-app-text-muted",
            "outline-none",
            disabled && "cursor-not-allowed text-neutral-400"
          )}
          {...props}
        />

        <button
          type="button"
          disabled={disabled || !isPassword}
          onClick={() => {
            if (isPassword) setShowPassword((current) => !current);
          }}
          className={cn(
            "mr-[16px] flex h-[32px] w-[32px] items-center justify-center",
            "text-app-text-muted transition-colors",
            isPassword && "hover:text-app-text",
            disabled && "cursor-not-allowed text-neutral-500"
          )}
        >
          {isPassword ? (
            showPassword ? (
              <Eye className="h-[22px] w-[22px]" />
            ) : (
              <EyeOff className="h-[22px] w-[22px]" />
            )
          ) : (
            <Mail className="h-[22px] w-[22px]" />
          )}
        </button>
      </div>

      {(informationText || errorText || forgotText) && (
        <div className="mt-[8px]">
          <InformationalText
            tone={hasError ? "error" : "default"}
            rightText={forgotText}
            onRightClick={onForgotClick}
          >
            {errorText || informationText}
          </InformationalText>
        </div>
      )}
    </div>
  );
}