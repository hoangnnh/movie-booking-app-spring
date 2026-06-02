import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Download,
  Landmark,
  MapPin,
  QrCode,
  Share2,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { bookingApi, concessionApi, movieApi, showtimeApi } from "../api/api";
import BookingProgress from "../components/booking/BookingProgress";
import TicketBarcode from "../components/booking/TicketBarcode";
import Button from "../components/common/Button";
import Footer from "../components/layout/Footer";
import { formatDuration, getPosterUrl } from "../components/home/homeUtils";
import { useAuth } from "../context/useAuth";
import { cn } from "../utils/cn";
import { formatVnd } from "../utils/currency";
import {
  clearFoodDraft,
  loadConfirmedBooking,
  loadFoodDraft,
  saveConfirmedBooking,
} from "../utils/checkoutDraft";
import { notifyNotificationsUpdated } from "../utils/notificationEvents";

const paymentMethods = [
  {
    key: "VNPAY_QR",
    title: "VNPAY QR",
    label: "Redirects to VNPAY sandbox",
    icon: QrCode,
  },
  {
    key: "DEMO_CARD",
    title: "Demo Card",
    label: "Local demo confirmation",
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
  const selectedFoodDraft = useMemo(() => loadFoodDraft(showtimeId), [showtimeId]);

  const [movie, setMovie] = useState(null);
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("DEMO_CARD");
  const [booking, setBooking] = useState(() =>
    loadConfirmedBooking(showtimeId, user?.userId, selectedSeatIds)
  );
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
        const [movieData, seatData, foodData] = await Promise.all([
          movieApi.getById(showtimeData.movieId),
          bookingApi.getSeats(showtimeId),
          concessionApi.getByShowtime(showtimeId),
        ]);

        setShowtime(showtimeData);
        setMovie(movieData);
        setSeats(seatData);
        setFoodItems(foodData);
      } catch (loadError) {
        setError(loadError?.message || "Cannot load payment details.");
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
  const selectedFoodItems = useMemo(
    () => {
      const quantities = new Map(
        selectedFoodDraft.map((item) => [item.foodItemId, item.quantity])
      );

      return foodItems
        .map((item) => ({ ...item, quantity: quantities.get(item.id) || 0 }))
        .filter((item) => item.quantity > 0);
    },
    [foodItems, selectedFoodDraft]
  );
  const ticketCount = selectedSeatIds.length;
  const ticketUnitPrice = Number(showtime?.price) || 0;
  const ticketTotal = ticketUnitPrice * ticketCount;
  const foodTotal = selectedFoodItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const grandTotal = ticketTotal + foodTotal;
  const seatsReady = ticketCount > 0;

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
      setBookingError("Please select at least one seat before payment.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await bookingApi.createBooking({
        userId: user.userId,
        showtimeId,
        seatIds: selectedSeatIds,
        foodItems: selectedFoodItems.map((item) => ({
          foodItemId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod,
      });

      clearFoodDraft(showtimeId);
      notifyNotificationsUpdated();

      if (response?.redirectRequired && response?.checkoutUrl) {
        window.location.assign(response.checkoutUrl);
        return;
      }

      const confirmedBooking = response?.booking || response;
      saveConfirmedBooking(showtimeId, user.userId, confirmedBooking);
      setBooking(confirmedBooking);
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

  if (booking) {
    return (
      <PaymentSuccessPage
        booking={booking}
        movieView={movieView}
        timeView={timeView}
        cinemaName={displayCinemaName}
        roomName={showtime.roomName}
        user={user}
        onViewBooking={() => navigate(`/my-booking/${booking.id}`)}
      />
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

        <BookingProgress currentStep={2} className="mb-[32px] sm:mb-[56px]" />

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
            <PaymentMethodPanel
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
            />
          </section>

          <aside className="xl:order-3">
            <div className="sticky top-[24px] rounded-tk-8 border border-app-border bg-app-surface p-[24px]">
              <div className="flex items-center gap-[10px]">
                <Ticket className="h-[20px] w-[20px] text-brand" />
                <h2 className="type-h5 text-app-text">Payment Summary</h2>
              </div>

              <div className="mt-[24px] grid gap-[12px]">
                <SummaryRow label="Tickets" value={formatVnd(ticketTotal)} />
                <SummaryRow label="Food & Drink" value={formatVnd(foodTotal)} />
                <SummaryRow label="Service Fee" value={formatVnd(0)} />
              </div>

              {selectedFoodItems.length > 0 && (
                <div className="mt-[18px] border-t border-app-border pt-[16px]">
                  <p className="type-body-xs text-app-text-muted">Snack Items</p>
                  <div className="mt-[8px] grid gap-[8px]">
                    {selectedFoodItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-[12px] type-body-xs">
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

              <Button
                size={48}
                variant="primary"
                className="mt-[24px] w-full"
                disabled={submitting || !seatsReady}
                onClick={completePayment}
              >
                {submitting ? "Processing..." : getPaymentButtonLabel(paymentMethod)}
              </Button>

              {bookingError && (
                <p className="mt-[12px] rounded-tk-4 border border-error-500 bg-app-background px-[10px] py-[8px] type-body-xs text-error-500">
                  {bookingError}
                </p>
              )}

              <div className="mt-[18px] flex items-start gap-[8px] border-t border-app-border pt-[16px] text-app-text-muted">
                <ShieldCheck className="mt-[1px] h-[16px] w-[16px] text-secondary-600" />
                <span className="type-body-xs">
                  {getPaymentHelpText(paymentMethod)}
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

function PaymentSuccessPage({
  booking,
  movieView,
  timeView,
  cinemaName,
  roomName,
  user,
  onViewBooking,
}) {
  const seats = booking.seatSummary || (booking.tickets || []).map((ticket) => ticket.seatLabel).join(", ");
  const orderNumber = String(booking.id).slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <div className="border-b border-app-border bg-app-surface-soft">
        <div className="ticketor-container py-[28px] sm:py-[56px]">
          <BookingProgress currentStep={3} />
        </div>
      </div>

      <main className="ticketor-container py-[32px] sm:py-[56px]">
        <div className="grid gap-[28px] lg:grid-cols-[330px_minmax(0,1fr)] lg:gap-[64px]">
          <aside>
            <SuccessMovieCard
              movieView={movieView}
              timeView={timeView}
              cinemaName={cinemaName}
              roomName={roomName}
              seats={seats}
            />
            <div className="mt-[2px] rounded-b-tk-8 bg-app-surface p-[20px]">
              <p className="type-body-xs text-app-text-muted">Order Number</p>
              <p className="type-body-m mt-[5px] text-app-text">{orderNumber}</p>
              <TicketBarcode value={booking.id} className="mt-[14px]" />
            </div>
          </aside>

          <section className="pt-[4px]">
            <p className="type-label-s text-brand">Ticket Confirmed</p>
            <h1 className="type-h3 mt-[6px] text-brand">Payment Successful!</h1>
            <p className="type-body-s mt-[8px] text-app-text-muted">
              Your ticket for {movieView.title} has been successfully purchased.
            </p>

            <div className="mt-[38px] grid gap-[32px] xl:grid-cols-2">
              <SuccessDetails title="Item Details">
                <SuccessRow label="Movie" value={movieView.title} />
                <SuccessRow label="Date" value={`${timeView.date}, ${timeView.time}`} />
                <SuccessRow label="Cinema" value={cinemaName} />
                <SuccessRow label="Room" value={roomName} />
                <SuccessRow label="Seats" value={seats || "Seats unavailable"} />
                {(booking.foodItems || []).map((item) => (
                  <SuccessRow
                    key={`${item.foodItemId || item.name}:${item.quantity}`}
                    label="Food & Drink"
                    value={`${item.quantity}x ${item.name} - ${formatVnd(item.lineTotal)}`}
                  />
                ))}
                <SuccessRow label="Total order" value={formatVnd(booking.totalAmount)} />
              </SuccessDetails>

              <SuccessDetails title="Customer Details">
                <SuccessRow label="Name" value={user?.fullName || "Signed-in customer"} />
                <SuccessRow label="Email Address" value={user?.email || "Not available"} />
                <SuccessRow label="Payment" value={formatPaymentMethod(booking.paymentMethod)} />
                <SuccessRow label="Reference" value={booking.paymentReference || "PAY-DEMO"} />
              </SuccessDetails>
            </div>

            <div className="mt-[34px] flex flex-wrap gap-[12px]">
              <button
                type="button"
                disabled
                title="Ticket download will be added next."
                className="inline-flex h-[48px] min-w-[220px] cursor-not-allowed items-center justify-center gap-[10px] rounded-button border border-primary-600 bg-primary-600 px-[22px] type-button-l text-neutral-900 opacity-60"
              >
                <Download className="h-[20px] w-[20px]" />
                Download ticket
              </button>
              <button
                type="button"
                disabled
                title="Ticket sharing will be added with ticket download."
                className="inline-flex h-[48px] min-w-[180px] cursor-not-allowed items-center justify-center gap-[10px] rounded-button border border-primary-600 px-[22px] type-button-l text-brand opacity-60"
              >
                <Share2 className="h-[20px] w-[20px]" />
                Share ticket
              </button>
              <Button size={48} variant="outline" onClick={onViewBooking}>
                View My Tickets
              </Button>
            </div>

            <p className="type-body-s mt-[20px] max-w-[560px] text-secondary-600">
              Thank you for choosing CinemaTick to purchase your tickets. We appreciate your trust in us.
            </p>
          </section>
        </div>
      </main>

      <Footer variant="plain" />
    </div>
  );
}

function SuccessMovieCard({ movieView, timeView, cinemaName, roomName, seats }) {
  return (
    <div className="overflow-hidden rounded-t-tk-8 bg-app-surface">
      <img
        src={movieView.posterUrl}
        alt={movieView.title}
        className="h-[280px] w-full object-cover"
      />
      <div className="p-[20px]">
        <h2 className="type-h5 text-app-text">{movieView.title}</h2>
        <p className="type-body-xs mt-[5px] text-app-text-muted">{movieView.duration}</p>
        <p className="type-body-s mt-[16px] text-app-text">{cinemaName}</p>
        <p className="type-body-xs mt-[5px] text-secondary-600">{roomName}</p>

        <div className="mt-[18px] grid grid-cols-3 gap-[12px] border-t border-app-border pt-[14px]">
          <ReceiptMeta label="Date" value={timeView.date} />
          <ReceiptMeta label="Time" value={timeView.time} />
          <ReceiptMeta label="Seats" value={seats || "-"} />
        </div>
      </div>
    </div>
  );
}

function ReceiptMeta({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="type-body-xs text-app-text-muted">{label}</p>
      <p className="type-body-s mt-[5px] break-words text-app-text">{value}</p>
    </div>
  );
}

function SuccessDetails({ title, children }) {
  return (
    <div>
      <h2 className="type-h5 text-app-text">{title}</h2>
      <div className="mt-[16px] grid gap-[9px]">{children}</div>
    </div>
  );
}

function SuccessRow({ label, value }) {
  return (
    <p className="type-body-s text-app-text-muted">
      <span className="text-app-text">{label}:</span> {value}
    </p>
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

function formatPaymentMethod(value) {
  if (value === "VNPAY_QR") return "VNPAY QR";
  return "Demo Card";
}

function getPaymentButtonLabel(value) {
  if (value === "VNPAY_QR") return "Continue to VNPAY";
  return "Confirm Demo Payment";
}

function getPaymentHelpText(value) {
  if (value === "VNPAY_QR") {
    return "Seats are reserved while VNPAY sandbox confirms the payment.";
  }

  return "Demo Card confirms locally without an external gateway.";
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
