import Avatar from "../common/Avatar";
import { cn } from "../../utils/cn";

export default function ReviewerProfile({
  avatarUrl = "",
  name = "Name",
  role = "Role",
  className = "",
}) {
  return (
    <div className={cn("flex flex-col gap-[12px]", className)}>
      <div className="h-[240px] w-[240px] overflow-hidden bg-app-surface">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Avatar size={100} />
          </div>
        )}
      </div>

      <div>
        <p className="type-body-s text-app-text-muted">{name}</p>
        <p className="type-body-s font-bold text-app-text">{role}</p>
      </div>
    </div>
  );
}