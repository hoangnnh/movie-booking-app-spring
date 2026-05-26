import AccountMenu from "./AccountMenu";
import DashboardNotice from "./DashboardNotice";
import ProfileSummaryCard from "./ProfileSummaryCard";
import UpcomingBookingCard from "./UpcomingBookingCard";
import { cn } from "../../utils/cn";

export default function UserDashboard({
  user,
  upcomingBookings = [],
  activeMenu = "booking",
  onMenuSelect,
  onViewBookings,
  onViewBookingDetails,
  className = "",
}) {
  const upcomingCount = upcomingBookings.length;

  return (
    <div className={cn("ticketor-container py-[48px]", className)}>
      <h1 className="type-h4 mb-[32px] text-app-text">My Booking</h1>

      <div className="grid grid-cols-12 gap-[16px]">
        <div className="col-span-12 lg:col-span-2">
          <AccountMenu activeKey={activeMenu} onSelect={onMenuSelect} />
        </div>

        <main className="col-span-12 flex flex-col gap-[24px] lg:col-span-7">
          <DashboardNotice
            description={`You have ${upcomingCount} upcoming movie${
              upcomingCount === 1 ? "" : "s"
            }`}
            onAction={onViewBookings}
          />

          <section className="rounded-tk-8 border border-app-border bg-app-background p-[16px]">
            <div className="flex flex-col gap-[12px]">
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map((booking) => (
                  <UpcomingBookingCard
                    key={booking.id}
                    posterUrl={booking.posterUrl}
                    movieTitle={booking.movieTitle}
                    dateTime={booking.dateTime}
                    cinemaName={booking.cinemaName}
                    seats={booking.seats}
                    onViewDetails={() => onViewBookingDetails?.(booking)}
                  />
                ))
              ) : (
                <div className="flex min-h-[120px] items-center justify-center rounded-tk-8 border border-dashed border-app-border">
                  <p className="type-body-s text-app-text-muted">
                    You have no upcoming bookings.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="col-span-12 lg:col-span-3">
          <ProfileSummaryCard user={user} />
        </aside>
      </div>
    </div>
  );
}
