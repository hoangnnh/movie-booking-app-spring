import { Bookmark, Ticket } from "lucide-react";
import { cn } from "../../utils/cn";

const menuItems = [
  {
    key: "booking",
    label: "My Booking",
    icon: Ticket,
  },
  {
    key: "watchlist",
    label: "My Watchlist",
    icon: Bookmark,
  },
];

export default function AccountMenu({
  activeKey = "booking",
  onSelect,
  className = "",
}) {
  return (
    <aside
      className={cn(
        "w-[180px] rounded-tk-8 border border-app-border bg-app-background p-[12px]",
        className
      )}
    >
      <nav className="flex flex-col gap-[8px]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = activeKey === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect?.(item.key)}
              className={cn(
                "flex items-center gap-[8px] rounded-tk-4 px-[12px] py-[10px]",
                "type-body-xs transition-colors",
                active
                  ? "bg-app-surface text-brand"
                  : "text-app-text-muted hover:bg-app-surface hover:text-app-text"
              )}
            >
              <Icon className="h-[16px] w-[16px]" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
