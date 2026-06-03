import { cn } from "../../utils/cn";

export default function Logo({ className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-app-text",
        className
      )}
      aria-label="CinemaTick"
    >
      <img
        src="/cinematick-logo-icon.svg"
        alt=""
        aria-hidden="true"
        className="cinematick-logo-mark h-[24px] w-[24px] shrink-0"
      />
      <span className="type-h5 leading-none">CinemaTick</span>
    </span>
  );
}
