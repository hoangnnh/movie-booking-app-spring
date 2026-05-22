import { useState } from "react";
import UserDashboard from "../components/dashboard/UserDashboard";

const demoUser = {
  fullName: "Luna Caldwell",
  email: "luna@example.com",
  role: "USER",
};

const poster =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop";

const demoBookings = [
  {
    id: "1",
    posterUrl: poster,
    movieTitle: "F1 The Movie",
    dateTime: "Tuesday, July 8. 10:30",
    cinemaName: "Regal Gallery Place",
    seats: "4 Tickets - Seat B6, B7, B8, B9",
  },
  {
    id: "2",
    posterUrl: poster,
    movieTitle: "F1 The Movie",
    dateTime: "Tuesday, July 8. 10:30",
    cinemaName: "Regal Gallery Place",
    seats: "4 Tickets - Seat B6, B7, B8, B9",
  },
];

export default function DashboardPreview() {
  const [activeMenu, setActiveMenu] = useState("account");

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <UserDashboard
        user={demoUser}
        upcomingBookings={demoBookings}
        activeMenu={activeMenu}
        onMenuSelect={setActiveMenu}
        onViewBookings={() => alert("Go to My Tickets")}
        onViewBookingDetails={(booking) => alert(`View ${booking.movieTitle}`)}
      />
    </div>
  );
}