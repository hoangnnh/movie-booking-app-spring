import { Mail, ShieldCheck } from "lucide-react";
import Avatar from "../common/Avatar";
import { cn } from "../../utils/cn";

export default function ProfileSummaryCard({
  user,
  avatarSrc = "",
  className = "",
}) {
  return (
    <section
      className={cn(
        "rounded-tk-8 border border-app-border bg-app-background p-[24px]",
        className
      )}
    >
      <h2 className="type-h6 mb-[20px] text-app-text">My Account</h2>

      <div className="flex items-center gap-[16px]">
        <Avatar size={56} src={avatarSrc} alt={user?.fullName || "User"} />

        <div className="min-w-0">
          <h3 className="type-h6 truncate text-app-text">
            {user?.fullName || "Guest User"}
          </h3>

          <div className="mt-[6px] flex items-center gap-[6px] text-app-text-muted">
            <Mail className="h-[14px] w-[14px]" />
            <span className="type-body-xs truncate">
              {user?.email || "No email"}
            </span>
          </div>

          <div className="mt-[6px] flex items-center gap-[6px] text-app-text-muted">
            <ShieldCheck className="h-[14px] w-[14px]" />
            <span className="type-body-xs">
              {user?.role || "USER"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}