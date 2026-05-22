import { useRef } from "react";
import { cn } from "../../utils/cn";

const sizeMap = {
  40: "h-[40px] w-[40px] type-h6",
  48: "h-[48px] w-[48px] type-h5",
  56: "h-[56px] w-[56px] type-h4",
};

export default function VerificationCodeInput({
  value = "",
  onChange,
  length = 4,
  size = 48,
  error = false,
  disabled = false,
  className = "",
}) {
  const inputRefs = useRef([]);

  const normalizedValue = value.slice(0, length);
  const selectedSize = sizeMap[size] || sizeMap[48];

  function updateValue(nextValue) {
    const cleanValue = nextValue.replace(/\D/g, "").slice(0, length);
    onChange?.(cleanValue);
  }

  function handleChange(index, event) {
    const digit = event.target.value.replace(/\D/g, "").slice(-1);

    const chars = normalizedValue.padEnd(length, " ").split("");
    chars[index] = digit || " ";

    const nextValue = chars.join("").replace(/\s/g, "");
    updateValue(nextValue);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace") {
      event.preventDefault();

      const chars = normalizedValue.padEnd(length, " ").split("");

      if (chars[index] && chars[index] !== " ") {
        chars[index] = " ";
        updateValue(chars.join("").replace(/\s/g, ""));
        return;
      }

      if (index > 0) {
        inputRefs.current[index - 1]?.focus();

        const prevChars = normalizedValue.padEnd(length, " ").split("");
        prevChars[index - 1] = " ";
        updateValue(prevChars.join("").replace(/\s/g, ""));
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event) {
    event.preventDefault();

    const pasted = event.clipboardData.getData("text");
    updateValue(pasted);

    const nextFocusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  }

  return (
    <div className={cn("flex items-center gap-[12px]", className)}>
      {Array.from({ length }).map((_, index) => {
        const digit = normalizedValue[index] || "";

        return (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            value={digit}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={disabled}
            onChange={(event) => handleChange(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className={cn(
              selectedSize,
              "rounded-tk-4 border bg-app-surface text-center font-bold text-app-text",
              "outline-none transition-colors",
              "focus:border-app-text focus:bg-app-surface-soft",
              digit && "border-app-text",
              error && "border-error-500 text-error-500 focus:border-error-500",
              disabled &&
                "cursor-not-allowed border-neutral-500 bg-neutral-700 text-neutral-400"
            )}
          />
        );
      })}
    </div>
  );
}