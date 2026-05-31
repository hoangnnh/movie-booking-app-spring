import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CircleAlert,
  Clock3,
  CreditCard,
  MapPin,
  Popcorn,
  Receipt,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { bookingApi } from "../api/api";
import Button from "../components/common/Button";
import DashboardNotice from "../components/dashboard/DashboardNotice";
import ProfileSummaryCard from "../components/dashboard/ProfileSummaryCard";
import UpcomingBookingCard from "../components/dashboard/UpcomingBookingCard";
import { getPosterUrl } from "../components/home/homeUtils";
import { useAuth } from "../context/useAuth";
import { formatVnd } from "../utils/currency";

function formatBookingDate(value) {
  const date = new Date(value);

  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSeatSummary(tickets) {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    return "Seats will appear after confirmation";
  }

  const seatLabels = tickets.map((ticket) => ticket.seatLabel).join(", ");
  return `${tickets.length} Ticket${tickets.length === 1 ? "" : "s"} - Seat ${seatLabels}`;
}

function normalizeBooking(booking) {
  const startTime = booking?.startTime ? new Date(booking.startTime) : null;
  const isConfirmed = booking?.status === "CONFIRMED";

  return {
    ...booking,
    posterUrl: getPosterUrl({ posterUrl: booking?.posterUrl }),
    dateTimeLabel: startTime ? formatBookingDate(startTime) : "Schedule pending",
    bookedAtLabel: booking?.bookedAt ? formatBookingDate(booking.bookedAt) : "Just now",
    seatsLabel: booking?.seatSummary
      ? `${booking?.tickets?.length || booking?.seatSummary.split(",").length} Ticket${
          booking?.tickets?.length === 1 || (!booking?.tickets?.length && booking?.seatSummary.split(",").length === 1)
            ? ""
            : "s"
        } - Seat ${booking.seatSummary}`
      : formatSeatSummary(booking?.tickets),
    isUpcoming: startTime ? startTime.getTime() >= Date.now() && isConfirmed : false,
    canCancel: Boolean(startTime) && startTime.getTime() > Date.now() && isConfirmed,
  };
}

export default function MyBookingPage({ onRequireAuth }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelingBookingId, setCancelingBookingId] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadBookings() {
      if (!isAuthenticated || !user?.userId) {
        setBookings([]);
        setSelectedBookingId("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await bookingApi.getUserBookings(user.userId);

        if (!ignore) {
          const normalizedBookings = (Array.isArray(data) ? data : []).map(normalizeBooking);
          setBookings(normalizedBookings);
          setSelectedBookingId(
            normalizedBookings[0]?.id || ""
          );
        }
      } catch {
        if (!ignore) {
          setError("We couldn't load your bookings right now.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, user?.userId]);

  const upcomingBookings = useMemo(
    () => bookings.filter((booking) => booking.isUpcoming),
    [bookings]
  );

  const pastBookings = useMemo(
    () => bookings.filter((booking) => !booking.isUpcoming),
    [bookings]
  );

  const selectedBooking = useMemo(() => {
    return (
      bookings.find((booking) => booking.id === selectedBookingId) ||
      bookings[0] ||
      null
    );
  }, [bookings, selectedBookingId]);

  async function handleCancelBooking(booking) {
    if (!booking?.id || cancelingBookingId) {
      return;
    }

    const shouldCancel = window.confirm(
      `Cancel booking ${String(booking.id).slice(0, 8).toUpperCase()} for ${booking.movieTitle}?`
    );

    if (!shouldCancel) {
      return;
    }

    try {
      setCancelingBookingId(booking.id);
      setError("");
      const updatedBooking = normalizeBooking(await bookingApi.cancelBooking(booking.id));

      setBookings((currentBookings) =>
        currentBookings.map((currentBooking) =>
          currentBooking.id === updatedBooking.id ? updatedBooking : currentBooking
        )
      );
      setSelectedBookingId(updatedBooking.id);
    } catch (cancelError) {
      setError(cancelError?.message || "We couldn't cancel this booking right now.");
    } finally {
      setCancelingBookingId("");
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="ticketor-container py-[72px]">
        <div className="rounded-card border border-app-border bg-app-surface p-[32px] text-center">
          <p className="type-label-m text-brand">MY BOOKING</p>
          <h1 className="type-h4 mt-[12px] text-app-text">
            Sign in to see your movie tickets.
          </h1>
          <p className="type-body-m mt-[12px] text-app-text-muted">
            Your confirmed seats, ticket codes, and payment details are saved in one place.
          </p>
          <div className="mt-[20px] flex justify-center">
            <Button size={40} onClick={onRequireAuth}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[48px]">
        <section className="rounded-tk-12 border border-app-border bg-app-surface p-[28px]">
          <p className="type-label-m text-brand">MY BOOKING</p>
          <div className="mt-[10px] flex flex-wrap items-end justify-between gap-[16px]">
            <div>
              <h1 className="type-h3 text-app-text">Tickets, schedules, and payment details</h1>
              <p className="type-body-m mt-[8px] text-app-text-muted">
                Track upcoming shows and revisit older bookings without leaving your account.
              </p>
            </div>
            <div className="rounded-full border border-app-border px-[14px] py-[8px] type-body-s text-app-text-muted">
              {bookings.length} booking{bookings.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        <div className="mt-[28px] grid grid-cols-12 gap-[16px]">
          <div className="col-span-12 flex flex-col gap-[24px] lg:col-span-9">
            <DashboardNotice
              title="Coming Up For You"
              description={`You have ${upcomingBookings.length} upcoming movie${
                upcomingBookings.length === 1 ? "" : "s"
              }`}
              actionText={selectedBooking ? "View Selected Booking" : "Browse Movies"}
              onAction={() => {
                if (selectedBooking?.showtimeId) {
                  setSelectedBookingId(selectedBooking.id);
                  return;
                }

                navigate("/movies/showing-now");
              }}
            />

            {loading && (
              <div className="rounded-card border border-app-border bg-app-surface p-[24px]">
                <p className="type-body-m text-app-text-muted">Loading your bookings...</p>
              </div>
            )}

            {error && (
              <div className="rounded-card border border-error-500 bg-app-background p-[16px] text-error-500">
                {error}
              </div>
            )}

            {!loading && !error && bookings.length === 0 && (
              <div className="rounded-card border border-dashed border-app-border bg-app-surface p-[40px] text-center">
                <h2 className="type-h5 text-app-text">No bookings yet.</h2>
                <p className="type-body-s mt-[8px] text-app-text-muted">
                  Book a showtime and your tickets will appear here right after checkout.
                </p>
                <div className="mt-[20px] flex justify-center">
                  <Button size={40} onClick={() => navigate("/movies/showing-now")}>
                    Browse Movies
                  </Button>
                </div>
              </div>
            )}

            {!loading && !error && upcomingBookings.length > 0 && (
              <section className="rounded-tk-8 border border-app-border bg-app-surface p-[16px]">
                <div className="mb-[14px] flex items-center justify-between gap-[12px]">
                  <h2 className="type-h6 text-app-text">Upcoming Bookings</h2>
                  <span className="type-body-xs text-app-text-muted">
                    Confirmed tickets for your next visits
                  </span>
                </div>

                <div className="flex flex-col gap-[12px]">
                  {upcomingBookings.map((booking) => (
                    <UpcomingBookingCard
                      key={booking.id}
                      posterUrl={booking.posterUrl}
                      movieTitle={booking.movieTitle}
                      dateTime={booking.dateTimeLabel}
                      cinemaName={booking.cinemaName}
                      seats={booking.seatsLabel}
                      onViewDetails={() => setSelectedBookingId(booking.id)}
                      className={
                        selectedBooking?.id === booking.id
                          ? "border-primary-600"
                          : ""
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {!loading && !error && selectedBooking && (
              <BookingDetailPanel
                booking={selectedBooking}
                onBrowseMovies={() => navigate("/movies/showing-now")}
                onCancelBooking={() => handleCancelBooking(selectedBooking)}
                canceling={cancelingBookingId === selectedBooking.id}
              />
            )}

            {!loading && !error && pastBookings.length > 0 && (
              <section className="rounded-tk-8 border border-app-border bg-app-surface p-[16px]">
                <div className="mb-[14px] flex items-center justify-between gap-[12px]">
                  <h2 className="type-h6 text-app-text">Previous Bookings</h2>
                  <span className="type-body-xs text-app-text-muted">
                    Reopen past confirmations and ticket codes
                  </span>
                </div>

                <div className="grid gap-[10px]">
                  {pastBookings.map((booking) => (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={() => setSelectedBookingId(booking.id)}
                      className={`flex items-center justify-between gap-[16px] rounded-tk-8 border px-[16px] py-[14px] text-left transition-colors ${
                        selectedBooking?.id === booking.id
                          ? "border-primary-600 bg-app-background"
                          : "border-app-border bg-app-background hover:border-app-text"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="type-body-m truncate text-app-text">{booking.movieTitle}</p>
                        <p className="type-body-xs mt-[4px] text-app-text-muted">
                          {booking.dateTimeLabel} / {booking.cinemaName}
                        </p>
                      </div>
                      <span className="type-body-xs text-app-text-muted">
                        {booking.status}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="col-span-12 lg:col-span-3">
            <ProfileSummaryCard user={user} />
          </aside>
        </div>
      </main>
    </div>
  );
}

function BookingDetailPanel({ booking, onBrowseMovies, onCancelBooking, canceling }) {
  const ticketCount = booking?.tickets?.length || 0;

  return (
    <section className="rounded-tk-12 border border-app-border bg-app-surface p-[24px]">
      <div className="flex flex-wrap items-start justify-between gap-[16px]">
        <div>
          <p className="type-label-s text-brand">BOOKING DETAILS</p>
          <h2 className="type-h4 mt-[6px] text-app-text">{booking.movieTitle}</h2>
          <p className="type-body-s mt-[8px] text-app-text-muted">
            Booking {String(booking.id).slice(0, 8).toUpperCase()} / Created {booking.bookedAtLabel}
          </p>
        </div>

        <div className="rounded-full border border-app-border px-[12px] py-[8px] type-body-xs text-app-text-muted">
          {booking.status} / {booking.paymentStatus}
        </div>
      </div>

      <div className="mt-[24px] grid gap-[12px] md:grid-cols-2">
        <DetailCard
          icon={CalendarDays}
          label="Showtime"
          value={booking.dateTimeLabel}
        />
        <DetailCard
          icon={MapPin}
          label="Cinema"
          value={`${booking.cinemaName} / ${booking.roomName}`}
        />
        <DetailCard
          icon={Ticket}
          label="Seats"
          value={booking.seatsLabel}
        />
        <DetailCard
          icon={CreditCard}
          label="Payment"
          value={`${formatPaymentMethod(booking.paymentMethod)} / ${booking.paymentReference || "PAY-DEMO"}`}
        />
      </div>

      <div className="mt-[24px] grid gap-[16px] xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-tk-8 border border-app-border bg-app-background p-[18px]">
          <div className="flex items-center gap-[10px]">
            <Receipt className="h-[18px] w-[18px] text-brand" />
            <h3 className="type-h6 text-app-text">Ticket Codes</h3>
          </div>

          <div className="mt-[14px] grid gap-[10px]">
            {(booking.tickets || []).length > 0 ? (
              (booking.tickets || []).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between gap-[12px] rounded-tk-4 border border-app-border bg-app-surface px-[14px] py-[12px]"
                >
                  <div>
                    <p className="type-body-s text-app-text">Seat {ticket.seatLabel}</p>
                    <p className="type-body-xs mt-[4px] text-app-text-muted">{ticket.code}</p>
                  </div>
                  <span className="type-body-xs text-app-text-muted">
                    {formatVnd(ticket.price)}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-tk-4 border border-dashed border-app-border bg-app-surface px-[14px] py-[16px]">
                <div className="flex items-start gap-[8px] text-app-text-muted">
                  <CircleAlert className="mt-[1px] h-[16px] w-[16px] text-secondary-600" />
                  <span className="type-body-xs">
                    {booking.status === "CANCELLED"
                      ? "This booking was cancelled and its ticket codes are no longer active."
                      : "Ticket codes will appear after confirmation."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-tk-8 border border-app-border bg-app-background p-[18px]">
          <div className="flex items-center gap-[10px]">
            <Popcorn className="h-[18px] w-[18px] text-brand" />
            <h3 className="type-h6 text-app-text">Payment Summary</h3>
          </div>

          <div className="mt-[14px] grid gap-[12px]">
            <SummaryRow label={`Tickets (${ticketCount})`} value={formatVnd(booking.ticketAmount)} />
            <SummaryRow label="Food & Drink" value={formatVnd(booking.foodAmount)} />
            <SummaryRow label="Total" value={formatVnd(booking.totalAmount)} emphasized />
          </div>

          <div className="mt-[18px] rounded-tk-4 border border-app-border bg-app-surface px-[12px] py-[10px]">
            <div className="flex items-center gap-[8px] text-app-text-muted">
              <ShieldCheck className="h-[16px] w-[16px] text-secondary-600" />
              <span className="type-body-xs">Payment status: {booking.paymentStatus}</span>
            </div>
          </div>

          <div className="mt-[12px] rounded-tk-4 border border-app-border bg-app-surface px-[12px] py-[10px]">
            <div className="flex items-center gap-[8px] text-app-text-muted">
              <Clock3 className="h-[16px] w-[16px] text-secondary-600" />
              <span className="type-body-xs">Booked on {booking.bookedAtLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[24px] flex flex-wrap gap-[12px]">
        <Button size={40} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Back to Top
        </Button>
        <Button size={40} variant="outline" tone="base" onClick={onBrowseMovies}>
          Book Another Movie
        </Button>
        {booking.canCancel && (
          <Button
            size={40}
            variant="outline"
            tone="base"
            disabled={canceling}
            onClick={onCancelBooking}
          >
            {canceling ? "Cancelling..." : "Cancel Ticket"}
          </Button>
        )}
      </div>
    </section>
  );
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-tk-8 border border-app-border bg-app-background p-[16px]">
      <div className="flex items-center gap-[8px] text-brand">
        <Icon className="h-[18px] w-[18px]" />
        <span className="type-body-xs text-app-text-muted">{label}</span>
      </div>
      <p className="type-body-m mt-[10px] text-app-text">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, emphasized = false }) {
  return (
    <div className="flex items-center justify-between gap-[16px]">
      <span className="type-body-xs text-app-text-muted">{label}</span>
      <span className={emphasized ? "type-h6 text-app-text" : "type-body-s text-app-text"}>
        {value}
      </span>
    </div>
  );
}

function formatPaymentMethod(value) {
  if (value === "VNPAY_QR") return "VNPAY QR";
  if (value === "MOMO_WALLET") return "MoMo Wallet";
  return "Demo Card";
}
