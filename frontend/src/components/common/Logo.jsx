import { cn } from "../../utils/cn";

export default function Logo({ className = "" }) {
  return (
    <div className={cn("flex items-center gap-[12px]", className)}>
      <div className="relative h-[18px] w-[32px] bg-brand">
        <div className="absolute left-[-1px] top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full bg-app-background" />
        <div className="absolute right-[-1px] top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full bg-app-background" />
      </div>

      <span className="type-h4 text-app-text">
        Ticketor
      </span>
    </div>
  );
}