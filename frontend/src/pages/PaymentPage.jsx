import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Landmark,
  MapPin,
  QrCode,
  ShieldCheck,
  Ticket,
  Wallet,
} from "lucide-react";
import { bookingApi, movieApi, showtimeApi } from "../api/api";
import BookingProgress from "../components/booking/BookingProgress";
import Button from "../components/common/Button";
import { formatDuration, getPosterUrl } from "../components/home/homeUtils";
import { useAuth } from "../context/useAuth";
import { cn } from "../utils/cn";
import { formatVnd } from "../utils/currency";

const snackCatalog = {
  "chicken-taco": { name: "Chicken Taco", price: 70000 },
  burger: { name: "Burger", price: 95000 },
  fries: { name: "Fries", price: 50000 },
  "hot-dog": { name: "Hot Dog", price: 42000 },
  "onion-rings": { name: "Onion Rings", price: 60000 },
  taco: { name: "Taco", price: 35000 },
  "iced-tea": { name: "Iced Tea", price: 65000 },
  "grape-soda": { name: "Grape Soda", price: 50000 },
  "ice-coffee": { name: "Ice Coffee", price: 40000 },
  "chocolate-drink": { name: "Chocolate drink", price: 42000 },
  popcorn: { name: "Popcorn", price: 70000 },
  "fanta-orange": { name: "Fanta Orange", price: 52000 },
};

const paymentMethods = [
  {
    key: "VNPAY_QR",
    title: "VNPAY QR",
    label: "Bank app or QR wallet",
    icon: QrCode,
  },
  {
    key: "MOMO_WALLET",
    title: "MoMo Wallet",
    label: "Mobile wallet checkout",
    icon: Wallet,
  },
  {
    key: "DEMO_CARD",
    title: "Demo Card",
    label: "Sandbox card payment",
    icon: CreditCard,
  },
];

function formatDateTime(value) {
  const date = new Date(value);

  return {
    date: date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export default function PaymentPage({ onRequireAuth }) {
  const { showtimeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const ticketCount = Math.max(1, Number(searchParams.get("tickets")) || 1);
  const selectedDateParam = searchParams.get("date") || "";
  const selectedStartTimeParam = searchParams.get("startTime") || "";
  const selectedCinemaNameParam = searchParams.get("cinemaName") || "";
  const selectedSeatIds = useMemo(
    () =>
      (searchParams.get("seats") || "")
        .split(",")
        .map((seatId) => seatId.trim())
        .filter(Boolean),
    [searchParams]
  );
  const selectedFoodItems = useMemo(
    () => parseSnackParam(searchParams.get("snacks")),
    [searchParams]
  );

  const [movie, setMovie] = useState(null);
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("VNPAY_QR");
  const [booking, setBooking] = useState(null);
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPaymentStep() {
      try {
        setLoading(true);
        setError("");

        const showtimeData = await showtimeApi.getById(showtimeId);
        const [movieData, seatData] = await Promise.all([
          movieApi.getById(showtimeData.movieId),
          bookingApi.getSeats(showtimeId),
        ]);

        setShowtime(showtimeData);
        setMovie(movieData);
        setSeats(seatData);
      } catch {
        setError("Cannot load payment details.");
      } finally {
        setLoading(false);
      }
    }

    loadPaymentStep();
  }, [showtimeId]);

  const movieView = useMemo(() => {
    if (!movie) return null;

    return {
      title: movie.title,
      posterUrl: getPosterUrl(movie, 0),
      duration: formatDuration(movie.durationMinutes),
      genres: Array.isArray(movie.genres) ? movie.genres.join(", ") : "Drama",
    };
  }, [movie]);

  const timeView = useMemo(() => {
    if (!showtime && !selectedStartTimeParam) return null;

    return formatDateTime(selectedStartTimeParam || showtime.startTime);
  }, [selectedStartTimeParam, showtime]);

  const selectedSeats = useMemo(
    () =>
      seats.filter((seat) =>
        selectedSeatIds.includes(String(seat.seatId || seat.id))
      ),
    [seats, selectedSeatIds]
  );

  const displayCinemaName = selectedCinemaNameParam || showtime?.cinemaName || "";
  const ticketUnitPrice = Number(showtime?.price) || 0;
  const ticketTotal = ticketUnitPrice * selectedSeatIds.length;
  const foodTotal = selectedFoodItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const fallbackFoodTotal = Number(searchParams.get("foodTotal")) || 0;
  const payableFoodTotal = foodTotal || fallbackFoodTotal;
  const grandTotal = ticketTotal + payableFoodTotal;
  const seatsReady = selectedSeatIds.length === ticketCount;

  function goBackToFood() {
    const nextParams = new URLSearchParams({
      tickets: String(ticketCount),
      seats: selectedSeatIds.join(","),
    });

    if (selectedDateParam) nextParams.set("date", selectedDateParam);
    if (selectedStartTimeParam) nextParams.set("startTime", selectedStartTimeParam);
    if (selectedCinemaNameParam) nextParams.set("cinemaName", selectedCinemaNameParam);

    navigate(`/booking/${showtimeId}/food?${nextParams.toString()}`);
  }

  async function completePayment() {
    setBookingError("");

    if (!isAuthenticated || !user?.userId) {
      setBookingError("Please sign in before payment.");
      onRequireAuth?.();
      return;
    }

    if (!seatsReady) {
      setBookingError(`Please select ${ticketCount} seat${ticketCount === 1 ? "" : "s"} before payment.`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await bookingApi.createBooking({
        userId: user.userId,
        showtimeId,
        seatIds: selectedSeatIds,
        foodAmount: Number(payableFoodTotal.toFixed(2)),
        paymentMethod,
      });

      setBooking(response);
    } catch (err) {
      setBookingError(cleanBookingError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-app-background text-app-text">
        <main className="ticketor-container py-[80px]">
          <p className="type-body-m text-app-text-muted">Loading payment...</p>
        </main>
      </div>
    );
  }

  if (error || !movieView || !showtime || !timeView) {
    return (
      <div className="min-h-screen bg-app-background text-app-text">
        <main className="ticketor-container py-[80px]">
          <div className="rounded-card border border-error-500 bg-app-background p-[24px] text-error-500">
            {error || "Payment is unavailable."}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[24px] sm:py-[40px]">
        <button
          type="button"
          className="mb-[32px] inline-flex items-center gap-[8px] type-body-s text-app-text-muted transition-colors hover:text-brand"
          onClick={goBackToFood}
        >
          <ChevronLeft className="h-[16px] w-[16px]" />
          Back to food and drink
        </button>

        <BookingProgress currentStep={booking ? 3 : 2} className="mb-[32px] sm:mb-[56px]" />

        <div className="grid gap-[20px] xl:grid-cols-[280px_minmax(0,1fr)_300px]">
          <aside className="xl:order-1">
            <MovieSummaryCard
              movieView={movieView}
              timeView={timeView}
              cinemaName={displayCinemaName}
              roomName={showtime.roomName}
              selectedSeats={selectedSeats}
            />
          </aside>

          <section className="xl:order-2">
            {booking ? (
              <TicketPanel booking={booking} paymentMethod={paymentMethod} />
            ) : (
              <PaymentMethodPanel
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
              />
            )}
          </section>

          <aside className="xl:order-3">
            <div className="sticky top-[24px] rounded-tk-8 border border-app-border bg-app-surface p-[24px]">
              <div className="flex items-center gap-[10px]">
                <Ticket className="h-[20px] w-[20px] text-brand" />
                <h2 className="type-h5 text-app-text">Payment Summary</h2>
              </div>

              <div className="mt-[24px] grid gap-[12px]">
                <SummaryRow label="Tickets" value={formatVnd(ticketTotal)} />
                <SummaryRow label="Food & Drink" value={formatVnd(payableFoodTotal)} />
                <SummaryRow label="Service Fee" value={formatVnd(0)} />
              </div>

              {selectedFoodItems.length > 0 && (
                <div className="mt-[18px] border-t border-app-border pt-[16px]">
                  <p className="type-body-xs text-app-text-muted">Snack Items</p>
                  <div className="mt-[8px] grid gap-[8px]">
                    {selectedFoodItems.map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-[12px] type-body-xs">
                        <span className="text-app-text-muted">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-app-text">
                          {formatVnd(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-[24px] border-t border-app-border pt-[20px]">
                <div className="flex items-center justify-between gap-[16px]">
                  <span className="type-body-s text-app-text-muted">Total Payment</span>
                  <span className="type-h5 text-app-text">
                    {formatVnd(grandTotal)}
                  </span>
                </div>
              </div>

              {!booking && (
                <Button
                  size={48}
                  variant="primary"
                  className="mt-[24px] w-full"
                  disabled={submitting || !seatsReady}
                  onClick={completePayment}
                >
                  {submitting ? "Processing..." : "Pay Now"}
                </Button>
              )}

              {booking && (
                <Button
                  size={48}
                  variant="primary"
                  className="mt-[24px] w-full"
                  onClick={() => navigate("/my-booking")}
                >
                  View My Booking
                </Button>
              )}

              {bookingError && (
                <p className="mt-[12px] rounded-tk-4 border border-error-500 bg-app-background px-[10px] py-[8px] type-body-xs text-error-500">
                  {bookingError}
                </p>
              )}

              <div className="mt-[18px] flex items-start gap-[8px] border-t border-app-border pt-[16px] text-app-text-muted">
                <ShieldCheck className="mt-[1px] h-[16px] w-[16px] text-secondary-600" />
                <span className="type-body-xs">
                  Sandbox payment confirms tickets immediately.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MovieSummaryCard({ movieView, timeView, cinemaName, roomName, selectedSeats }) {
  return (
    <div className="sticky top-[24px] overflow-hidden rounded-tk-8 border border-app-border bg-app-surface">
      <img
        src={movieView.posterUrl}
        alt={movieView.title}
        className="h-[320px] w-full object-cover"
      />

      <div className="p-[20px]">
        <h1 className="type-h5 text-app-text">{movieView.title}</h1>
        <p className="type-body-xs mt-[6px] text-app-text-muted">
          {movieView.genres} / {movieView.duration}
        </p>

        <div className="mt-[18px] grid gap-[12px] text-app-text-muted">
          <InfoRow icon={<CalendarDays />} label={`${timeView.date}, ${timeView.time}`} />
          <InfoRow icon={<MapPin />} label={cinemaName} />
          <InfoRow icon={<Landmark />} label={roomName} />
        </div>

        <div className="mt-[18px] border-t border-app-border pt-[16px]">
          <p className="type-body-xs text-app-text-muted">Selected Seats</p>
          <div className="mt-[8px] flex flex-wrap gap-[6px]">
            {selectedSeats.length > 0 ? (
              selectedSeats.map((seat) => (
                <span
                  key={seat.seatId || seat.id}
                  className="rounded-tk-4 border border-app-border px-[8px] py-[4px] type-label-s text-app-text"
                >
                  {seat.label}
                </span>
              ))
            ) : (
              <span className="type-body-s text-app-text-muted">
                No seats selected.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodPanel({ paymentMethod, onPaymentMethodChange }) {
  return (
    <div className="rounded-tk-8 border border-app-border bg-app-surface p-[28px]">
      <p className="type-label-s text-brand">Payment</p>
      <h2 className="type-h4 mt-[4px] text-app-text">Choose Payment Method</h2>

      <div className="mt-[24px] grid gap-[12px]">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const selected = paymentMethod === method.key;

          return (
            <button
              key={method.key}
              type="button"
              onClick={() => onPaymentMethodChange(method.key)}
              className={cn(
                "flex min-h-[82px] items-center gap-[16px] rounded-tk-8 border px-[18px] text-left transition-colors",
                selected
                  ? "border-primary-600 bg-app-background"
                  : "border-app-border bg-app-surface-soft hover:border-app-text"
              )}
            >
              <span
                className={cn(
                  "flex h-[42px] w-[42px] items-center justify-center rounded-tk-4",
                  selected ? "bg-primary-600 text-neutral-900" : "bg-app-background text-app-text"
                )}
              >
                <Icon className="h-[21px] w-[21px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block type-body-m text-app-text">{method.title}</span>
                <span className="mt-[3px] block type-body-xs text-app-text-muted">
                  {method.label}
                </span>
              </span>
              {selected && <CheckCircle2 className="h-[22px] w-[22px] text-brand" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TicketPanel({ booking, paymentMethod }) {
  return (
    <div className="rounded-tk-8 border border-primary-600 bg-app-surface p-[28px]">
      <div className="flex items-start gap-[16px]">
        <span className="flex h-[46px] w-[46px] items-center justify-center rounded-tk-4 bg-primary-600 text-neutral-900">
          <CheckCircle2 className="h-[24px] w-[24px]" />
        </span>
        <div>
          <p className="type-label-s text-brand">Ticket Confirmed</p>
          <h2 className="type-h4 mt-[4px] text-app-text">
            Booking {String(booking.id).slice(0, 8).toUpperCase()}
          </h2>
          <p className="type-body-s mt-[6px] text-app-text-muted">
            {formatPaymentMethod(paymentMethod)} / {booking.paymentReference || "PAY-DEMO"}
          </p>
        </div>
      </div>

      <div className="mt-[24px] grid gap-[10px]">
        {(booking.tickets || []).map((ticket) => (
          <div
            key={ticket.id}
            className="flex items-center justify-between rounded-tk-4 border border-app-border bg-app-background px-[14px] py-[12px]"
          >
            <div>
              <p className="type-body-s text-app-text">Seat {ticket.seatLabel}</p>
              <p className="type-body-xs text-app-text-muted">{ticket.code}</p>
            </div>
            <Ticket className="h-[18px] w-[18px] text-brand" />
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ icon, label }) {
  return (
    <div className="flex items-center gap-[10px]">
      <span className="flex h-[18px] w-[18px] items-center justify-center text-secondary-600">
        {icon}
      </span>
      <span className="type-body-s">{label}</span>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-[16px]">
      <span className="type-body-xs text-app-text-muted">{label}</span>
      <span className="type-body-s text-right text-app-text">{value}</span>
    </div>
  );
}

function parseSnackParam(value) {
  if (!value) return [];

  return value
    .split(",")
    .map((entry) => {
      const [key, quantityValue] = entry.split(":");
      const item = snackCatalog[key];
      const quantity = Math.max(0, Number(quantityValue) || 0);

      return item && quantity > 0
        ? {
            key,
            name: item.name,
            price: item.price,
            quantity,
          }
        : null;
    })
    .filter(Boolean);
}

function formatPaymentMethod(value) {
  if (value === "VNPAY_QR") return "VNPAY QR";
  if (value === "MOMO_WALLET") return "MoMo Wallet";
  return "Demo Card";
}

function cleanBookingError(error) {
  const message = error?.message || "Payment failed.";

  if (message.includes("already booked")) {
    return "One of these seats has just been booked. Go back and choose another seat.";
  }

  if (message.includes("401") || message.includes("Unauthorized")) {
    return "Please sign in before payment.";
  }

  if (message.includes("Payment method")) {
    return "This payment method is not available.";
  }

  return message;
}
