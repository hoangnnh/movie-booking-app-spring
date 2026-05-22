import ScoreBadge from "./ScoreBadge";
import { cn } from "../../utils/cn";

export default function UserScoreSummary({
  score = "7.5",
  label = "User Score",
  description = "Generally Favorable",
  className = "",
}) {
  return (
    <div className={cn("flex items-center gap-[24px]", className)}>
      <ScoreBadge value={score} tone="brand" size="lg" />

      <div>
        <p className="type-body-m text-app-text-muted">{label}</p>
        <p className="type-h5 text-app-text">{description}</p>
      </div>
    </div>
  );
}