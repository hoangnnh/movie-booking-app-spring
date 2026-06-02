import {
  Clapperboard,
  HandCoins,
  Ticket,
  UserCircle,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";

export default function ProfileSidebar({ user, activeKey = "account" }) {
  const navigate = useNavigate();
  const menuItems = [
    { key: "account", label: "My Account", icon: UserCircle, to: "/profile" },
    { key: "tickets", label: "My Tickets", icon: Ticket, to: "/my-booking" },
    { key: "wallet", label: "My Wallet", icon: WalletCards, planned: true },
    { key: "payments", label: "Payments", icon: HandCoins, planned: true },
    { key: "watchlist", label: "My Watchlist", icon: Clapperboard, planned: true },
  ];

  return (
    <div className="lg:sticky lg:top-[28px]">
      <div className="flex items-center gap-[14px]">
        <Avatar size={80} src={user?.avatarUrl} alt={user?.fullName || "User"} className="rounded-tk-8" />
        <div className="min-w-0">
          <p className="type-body-s truncate text-app-text">{user?.fullName}</p>
          <p className="type-body-xs mt-[4px] truncate text-app-text-muted">{user?.email}</p>
        </div>
      </div>

      <nav className="mt-[38px] grid gap-[8px]">
        {menuItems.map(({ key, label, icon: Icon, planned, to }) => (
          <button
            key={key}
            type="button"
            disabled={planned}
            title={planned ? `${label} is planned.` : undefined}
            onClick={() => to && navigate(to)}
            className={`flex items-center gap-[10px] rounded-tk-4 px-[2px] py-[10px] text-left type-body-s transition-colors ${
              activeKey === key
                ? "text-brand"
                : planned
                  ? "cursor-not-allowed text-app-text-muted/55"
                  : "text-app-text-muted hover:text-app-text"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
