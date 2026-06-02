import { Bell } from "lucide-react";
import { cn } from "../../utils/cn";

export default function NotificationAvatar({ notification, size = 44 }) {
  const hasImage = notification?.type === "BOOKING_CONFIRMED" && notification?.imageUrl;

  return (
    <div
      className="relative shrink-0"
      style={{ height: `${size}px`, width: `${size}px` }}
    >
      {hasImage ? (
        <img
          src={notification.imageUrl}
          alt=""
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-app-surface-soft text-app-text-muted">
          <Bell className="h-[18px] w-[18px]" />
        </span>
      )}

      <span
        className={cn(
          "absolute bottom-0 right-0 h-[10px] w-[10px] rounded-full border-2 border-app-surface",
          notification?.read ? "bg-app-border" : "bg-brand"
        )}
      />
    </div>
  );
}
