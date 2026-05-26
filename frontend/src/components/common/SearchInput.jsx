import { forwardRef } from "react";
import { Search } from "lucide-react";
import { cn } from "../../utils/cn";

const sizeMap = {
  40: {
    wrapper: "h-[40px]",
    input: "type-body-s px-[16px] pl-[16px] pr-[48px]",
    icon: "h-[20px] w-[20px]",
  },
  48: {
    wrapper: "h-[48px]",
    input: "type-body-m px-[20px] pl-[20px] pr-[56px]",
    icon: "h-[24px] w-[24px]",
  },
};

const SearchInput = forwardRef(function SearchInput({
  value,
  onChange,
  placeholder = "Search here",
  size = 48,
  className = "",
  ...props
}, ref) {
  const selectedSize = sizeMap[size] || sizeMap[48];

  return (
    <div
      className={cn(
        "relative w-full",
        selectedSize.wrapper,
        className
      )}
    >
      <input
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "h-full w-full rounded-none border-none",
          "bg-neutral-700 text-app-text placeholder:text-app-text-muted",
          "outline-none transition-colors",
          "focus:bg-neutral-600",
          selectedSize.input
        )}
        {...props}
      />

      <Search
        className={cn(
          "absolute right-[16px] top-1/2 -translate-y-1/2 text-app-text",
          selectedSize.icon
        )}
      />
    </div>
  );
});

export default SearchInput;
