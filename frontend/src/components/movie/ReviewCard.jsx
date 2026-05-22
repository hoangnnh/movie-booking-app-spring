import { ArrowUpRight } from "lucide-react";
import ScoreBadge from "./ScoreBadge";
import { cn } from "../../utils/cn";

export default function ReviewCard({
  score = "9",
  name = "Name",
  date = "jun 25, 2025",
  text = "Digressive, sure, but hot damn the film is fun, its 155-minute running time as slick as the track at Monza in a rainstorm. And just in time for summer.",
  onFullReview,
  className = "",
}) {
  return (
    <article
      className={cn(
        "w-full rounded-tk-8 border border-app-border bg-app-background p-[24px]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-[24px]">
        <div className="flex items-center gap-[16px]">
          <ScoreBadge value={score} tone="info" size="sm" />
          <h3 className="type-h6 text-app-text">{name}</h3>
        </div>

        <p className="type-body-s text-app-text-muted">{date}</p>
      </div>

      <p className="type-body-s mt-[24px] text-app-text">{text}</p>

      <div className="mt-[32px] border-t border-app-border pt-[16px]">
        <button
          type="button"
          onClick={onFullReview}
          className="ml-auto flex items-center gap-[8px] type-body-s text-app-text transition-colors hover:text-brand"
        >
          Full Review
          <span className="flex h-[20px] w-[20px] items-center justify-center rounded-tk-4 border border-secondary-600 text-secondary-600">
            <ArrowUpRight className="h-[14px] w-[14px]" />
          </span>
        </button>
      </div>
    </article>
  );
}