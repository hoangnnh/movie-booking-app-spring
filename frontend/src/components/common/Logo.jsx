import { cn } from "../../utils/cn";

export default function Logo({ className = "" }) {
  return (
    <img
      src="/cinematick-logo-full.svg"
      alt="CinemaTick"
      className={cn("cinematick-logo h-[32px] w-auto", className)}
    />
  );
}
