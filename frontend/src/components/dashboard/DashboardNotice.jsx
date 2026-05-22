import { CalendarDays } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/cn";

export default function DashboardNotice({
  title = "Coming Up For You",
  description = "You have 1 upcoming movie",
  actionText = "View Your Booking",
  onAction,
  className = "",
}) {
  return (
    <section
      className={cn(
        "flex min-h-[72px] items-center justify-between rounded-tk-8 border border-app-border bg-app-background px-[24px]",
        className
      )}
    >
      <div className="flex items-center gap-[12px]">
        <div className="flex h-[32px] w-[32px] items-center justify-center rounded-tk-4 bg-app-surface text-brand">
          <CalendarDays className="h-[18px] w-[18px]" />
        </div>

        <div>
          <h2 className="type-h6 text-app-text">{title}</h2>
          <p className="type-body-xs mt-[2px] text-app-text-muted">
            {description}
          </p>
        </div>
      </div>

      <Button size={32} variant="text" tone="base" onClick={onAction}>
        {actionText}
      </Button>
    </section>
  );
}