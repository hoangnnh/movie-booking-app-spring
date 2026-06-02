import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Ticket,
} from "lucide-react";
import { bookingApi, concessionApi, movieApi, showtimeApi } from "../api/api";
import BookingProgress from "../components/booking/BookingProgress";
import Button from "../components/common/Button";
import { formatDuration, getPosterUrl } from "../components/home/homeUtils";
import { useAuth } from "../context/useAuth";
import { formatVnd } from "../utils/currency";
import { loadFoodDraft, saveFoodDraft } from "../utils/checkoutDraft";

const ticketPrice = 75000;

const foodVisuals = {
  "sweet-popcorn": { palette: ["#df4e4e", "#f1f1f3", "#fdfd82"], shape: "popcorn" },
  "caramel-popcorn": { palette: ["#8a5a37", "#f9c378", "#fdfd82"], shape: "popcorn" },
  "cheese-popcorn": { palette: ["#f5a042", "#fdfd82", "#f1f1f3"], shape: "popcorn" },
  "hot-dog": { palette: ["#f9c378", "#df4e4e", "#fbfb1e"], shape: "hotdog" },
  sausage: { palette: ["#f9c378", "#df4e4e", "#fbfb1e"], shape: "hotdog" },
  "large-soft-drink": { palette: ["#df4e4e", "#f1f1f3", "#e0e0e4"], shape: "cup" },
  "bottled-water": { palette: ["#3db1b1", "#b3e5e5", "#f1f1f3"], shape: "cup" },
  "my-combo": { palette: ["#df4e4e", "#fdfd82", "#f1f1f3"], shape: "popcorn" },
  "couple-combo": { palette: ["#f38e30", "#fdfd82", "#f1f1f3"], shape: "popcorn" },
};

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

function createSnackImage(item) {
  const [primary, secondary, accent] = item.palette;
  const shape = getSnackShape(item.shape, primary, secondary, accent);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="260" height="180" viewBox="0 0 260 180">
      <rect width="260" height="180" rx="18" fill="#141418"/>
      <rect x="14" y="14" width="232" height="152" rx="16" fill="#202028"/>
      <circle cx="63" cy="42" r="32" fill="${primary}" opacity="0.18"/>
      <circle cx="198" cy="132" r="38" fill="${accent}" opacity="0.13"/>
      ${shape}
      <text x="130" y="158" text-anchor="middle" fill="#f1f1f3" font-family="Arial, sans-serif" font-size="15" font-weight="700">${item.name}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getSnackShape(shape, primary, secondary, accent) {
  if (shape === "burger") {
    return `
      <ellipse cx="130" cy="74" rx="58" ry="23" fill="${primary}"/>
      <rect x="80" y="72" width="100" height="15" rx="7" fill="${secondary}"/>
      <rect x="75" y="88" width="110" height="18" rx="8" fill="#6f3f25"/>
      <rect x="82" y="107" width="96" height="10" rx="5" fill="${accent}"/>
      <ellipse cx="130" cy="120" rx="55" ry="17" fill="${primary}"/>
    `;
  }

  if (shape === "fries") {
    return `
      <path d="M93 72h74l-10 64h-54z" fill="${primary}"/>
      <path d="M101 66h10l9 63h-13zM122 56h11l5 73h-14zM144 63h11l-6 66h-12z" fill="${secondary}"/>
      <path d="M95 91h70l-4 19h-62z" fill="${accent}"/>
    `;
  }

  if (shape === "hotdog") {
    return `
      <ellipse cx="130" cy="98" rx="70" ry="28" fill="${primary}"/>
      <rect x="69" y="83" width="122" height="22" rx="11" fill="${secondary}"/>
      <path d="M78 94c17-17 29 17 46 0s29 17 46 0" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
    `;
  }

  if (shape === "rings") {
    return `
      <circle cx="102" cy="94" r="29" fill="${primary}"/>
      <circle cx="102" cy="94" r="15" fill="#202028"/>
      <circle cx="135" cy="82" r="31" fill="${secondary}"/>
      <circle cx="135" cy="82" r="16" fill="#202028"/>
      <circle cx="160" cy="107" r="28" fill="${primary}"/>
      <circle cx="160" cy="107" r="14" fill="#202028"/>
    `;
  }

  if (shape === "cup") {
    return `
      <path d="M93 63h74l-10 75h-54z" fill="${primary}"/>
      <path d="M103 78h54l-6 50h-42z" fill="${secondary}" opacity="0.72"/>
      <rect x="91" y="55" width="78" height="12" rx="6" fill="${accent}"/>
      <path d="M111 47h50" stroke="#f1f1f3" stroke-width="5" stroke-linecap="round"/>
    `;
  }

  if (shape === "popcorn") {
    return `
      <path d="M89 74h82l-12 66H101z" fill="${primary}"/>
      <path d="M105 77h13l-4 58h-15zM141 77h13l7 58h-15z" fill="${secondary}"/>
      <circle cx="96" cy="69" r="13" fill="${accent}"/>
      <circle cx="116" cy="58" r="15" fill="${accent}"/>
      <circle cx="138" cy="60" r="14" fill="${accent}"/>
      <circle cx="160" cy="70" r="13" fill="${accent}"/>
    `;
  }

  if (shape === "can") {
    return `
      <rect x="103" y="52" width="54" height="88" rx="13" fill="${primary}"/>
      <rect x="111" y="64" width="38" height="50" rx="10" fill="${secondary}" opacity="0.62"/>
      <circle cx="130" cy="89" r="18" fill="${accent}" opacity="0.9"/>
      <rect x="113" y="45" width="34" height="8" rx="4" fill="#e0e0e4"/>
    `;
  }

  return `
    <path d="M73 121c8-40 37-64 86-64 20 0 32 7 38 21-39 5-70 21-93 51z" fill="${primary}"/>
    <path d="M88 111c12-20 36-35 74-45 9 5 16 11 22 18-32 5-58 17-80 36z" fill="${secondary}"/>
    <circle cx="133" cy="89" r="7" fill="${accent}"/>
    <circle cx="159" cy="80" r="6" fill="${accent}"/>
  `;
}

function toSnackView(item) {
  const visual = foodVisuals[item.slug] || {
    palette: ["#f38e30", "#f9c378", "#f1f1f3"],
    shape: "popcorn",
  };
  const nextItem = {
    ...item,
    key: item.id,
    ...visual,
  };

  return {
    ...nextItem,
    imageUrl: item.imageUrl || createSnackImage(nextItem),
  };
}

function toQuantities(foodItems) {
  return Object.fromEntries(
    foodItems.map((item) => [item.foodItemId, item.quantity])
  );
}

function toFoodItemRequests(quantities) {
  return Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([foodItemId, quantity]) => ({ foodItemId, quantity }));
}

export default function FoodDrinkPage({ onRequireAuth }) {
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

  const [movie, setMovie] = useState(null);
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [cartStatus, setCartStatus] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFoodStep() {
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
        setQuantities(toQuantities(loadFoodDraft(showtimeId)));
      } catch (loadError) {
        setError(loadError?.message || "Cannot load food and drink selection.");
      } finally {
        setLoading(false);
      }
    }

    loadFoodStep();
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

  const displayCinemaName = selectedCinemaNameParam || showtime?.cinemaName || "";

  const selectedSeats = useMemo(
    () =>
      seats.filter((seat) =>
        selectedSeatIds.includes(String(seat.seatId || seat.id))
      ),
    [seats, selectedSeatIds]
  );

  const snackItems = useMemo(
    () => foodItems.map(toSnackView),
    [foodItems]
  );

  const selectedSnackItems = useMemo(
    () =>
      snackItems
        .map((item) => ({ ...item, quantity: quantities[item.key] || 0 }))
        .filter((item) => item.quantity > 0),
    [quantities, snackItems]
  );

  const foodTotal = selectedSnackItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const ticketUnitPrice = Number(showtime?.price) || ticketPrice;
  const ticketCount = selectedSeatIds.length;
  const ticketTotal = ticketCount * ticketUnitPrice;
  const grandTotal = ticketTotal + foodTotal;
  const hasSnacks = selectedSnackItems.length > 0;
  const seatsReady = ticketCount > 0;

  function updateQuantity(itemKey, direction) {
    setCartStatus("");
    setBookingError("");
    setQuantities((current) => {
      const next = {
        ...current,
        [itemKey]: Math.max(0, Math.min(9, (current[itemKey] || 0) + direction)),
      };
      saveFoodDraft(showtimeId, toFoodItemRequests(next));
      return next;
    });
  }

  function skipSnacks() {
    setQuantities({});
    saveFoodDraft(showtimeId, []);
    setCartStatus("Food and drink skipped.");
  }

  function continueToPayment() {
    setBookingError("");
    setCartStatus("");

    if (!isAuthenticated || !user?.userId) {
      setBookingError("Please sign in before payment.");
      onRequireAuth?.();
      return;
    }

    if (!seatsReady) {
      setBookingError("Please select at least one seat before confirming.");
      return;
    }

    const nextParams = new URLSearchParams({
      tickets: String(ticketCount),
      seats: selectedSeatIds.join(","),
    });

    if (selectedDateParam) {
      nextParams.set("date", selectedDateParam);
    }

    if (selectedStartTimeParam) {
      nextParams.set("startTime", selectedStartTimeParam);
    }

    if (selectedCinemaNameParam) {
      nextParams.set("cinemaName", selectedCinemaNameParam);
    }

    navigate(`/booking/${showtimeId}/payment?${nextParams.toString()}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-app-background text-app-text">
        <main className="ticketor-container py-[80px]">
          <p className="type-body-m text-app-text-muted">Loading food and drinks...</p>
        </main>
      </div>
    );
  }

  if (error || !movieView || !showtime || !timeView) {
    return (
      <div className="min-h-screen bg-app-background text-app-text">
        <main className="ticketor-container py-[80px]">
          <div className="rounded-card border border-error-500 bg-app-background p-[24px] text-error-500">
            {error || "Food and drink selection is unavailable."}
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
          onClick={() => {
            const nextParams = new URLSearchParams({
              tickets: String(ticketCount),
              seats: selectedSeatIds.join(","),
            });

            if (selectedDateParam) {
              nextParams.set("date", selectedDateParam);
            }

            if (selectedStartTimeParam) {
              nextParams.set("startTime", selectedStartTimeParam);
            }

            if (selectedCinemaNameParam) {
              nextParams.set("cinemaName", selectedCinemaNameParam);
            }

            navigate(`/booking/${showtimeId}/seats?${nextParams.toString()}`);
          }}
        >
          <ChevronLeft className="h-[16px] w-[16px]" />
          Back to seat selection
        </button>

        <BookingProgress currentStep={1} className="mb-[32px] sm:mb-[56px]" />

        <div className="grid gap-[20px] xl:grid-cols-[280px_minmax(0,1fr)_300px]">
          <aside className="xl:order-1">
            <div className="sticky top-[24px] overflow-hidden rounded-tk-8 border border-app-border bg-app-surface">
              <img
                src={movieView.posterUrl}
                alt={movieView.title}
                className="h-[320px] w-full object-cover"
              />

              <div className="p-[20px]">
                <h1 className="type-h5 text-app-text">{movieView.title}</h1>
                <p className="type-body-xs mt-[6px] text-app-text-muted">
                  {movieView.genres}
                </p>

                <div className="mt-[18px] grid gap-[12px] text-app-text-muted">
                  <InfoRow icon={<CalendarDays />} label={timeView.date} />
                  <InfoRow icon={<Clock />} label={timeView.time} />
                  <InfoRow icon={<MapPin />} label={displayCinemaName} />
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
          </aside>

          <section className="xl:order-2">
            <div className="mb-[20px]">
              <p className="type-label-s text-brand">Food & Drink</p>
              <h2 className="type-h4 mt-[4px] text-app-text">Choose Your Snacks</h2>
            </div>

            <div className="grid gap-[12px] sm:grid-cols-2 2xl:grid-cols-3">
              {snackItems.map((item) => (
                <SnackCard
                  key={item.key}
                  item={item}
                  quantity={quantities[item.key] || 0}
                  onUpdate={updateQuantity}
                />
              ))}
            </div>
          </section>

          <aside className="xl:order-3">
            <div className="sticky top-[24px] rounded-tk-8 border border-app-border bg-app-surface p-[24px]">
              <div className="flex items-center gap-[10px]">
                <ShoppingCart className="h-[20px] w-[20px] text-brand" />
                <h2 className="type-h5 text-app-text">Selected Snacks</h2>
              </div>

              <div className="mt-[20px] min-h-[128px]">
                {hasSnacks ? (
                  <div className="grid gap-[10px]">
                    {selectedSnackItems.map((item) => (
                      <SelectedSnackRow
                        key={item.key}
                        item={item}
                        onUpdate={updateQuantity}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="type-body-s text-app-text-muted">
                    You have not selected any snacks yet.
                  </p>
                )}
              </div>

              <div className="mt-[24px] border-t border-app-border pt-[20px]">
                <SummaryRow label="Tickets" value={formatVnd(ticketTotal)} />
                <SummaryRow label="Food & Drink" value={formatVnd(foodTotal)} />
                <SummaryRow label="Tax included" value="" muted />

                <div className="mt-[16px] flex items-center justify-between">
                  <span className="type-body-s text-app-text-muted">Total Payment</span>
                  <span className="type-h5 text-app-text">
                    {formatVnd(grandTotal)}
                  </span>
                </div>
              </div>

              <Button
                size={48}
                variant="primary"
                disabled={!seatsReady}
                className="mt-[24px] w-full"
                rightIcon={<ChevronRight />}
                onClick={continueToPayment}
              >
                Continue to Payment
              </Button>
              <Button
                size={48}
                variant="outline"
                tone="base"
                className="mt-[10px] w-full"
                onClick={skipSnacks}
              >
                Skip Snacks
              </Button>

              {cartStatus && (
                <p className="mt-[12px] rounded-tk-4 border border-app-border bg-app-background px-[10px] py-[8px] type-body-xs text-app-text-muted">
                  {cartStatus}
                </p>
              )}

              {bookingError && (
                <p className="mt-[12px] rounded-tk-4 border border-error-500 bg-app-background px-[10px] py-[8px] type-body-xs text-error-500">
                  {bookingError}
                </p>
              )}

              <div className="mt-[18px] flex items-center gap-[8px] border-t border-app-border pt-[16px] text-app-text-muted">
                <Ticket className="h-[16px] w-[16px]" />
                <span className="type-body-xs">
                  {ticketCount} ticket{ticketCount === 1 ? "" : "s"} selected
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function SnackCard({ item, quantity, onUpdate }) {
  return (
    <article className="overflow-hidden rounded-tk-8 border border-app-border bg-app-surface">
      <img
        src={item.imageUrl}
        alt=""
        className="h-[104px] w-full bg-app-background object-cover"
      />

      <div className="p-[12px]">
        <h3 className="type-body-s font-bold text-app-text">{item.name}</h3>
        <p className="mt-[3px] line-clamp-2 min-h-[36px] type-body-xs text-app-text-muted">
          {item.description}
        </p>

        <div className="mt-[10px] flex items-center justify-between gap-[8px]">
          <span className="type-label-s text-brand">{formatVnd(item.price)}</span>
          <QuantityControl
            label={item.name}
            quantity={quantity}
            onDecrement={() => onUpdate(item.key, -1)}
            onIncrement={() => onUpdate(item.key, 1)}
          />
        </div>
      </div>
    </article>
  );
}

function SelectedSnackRow({ item, onUpdate }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-[12px] rounded-tk-4 border border-app-border bg-app-background px-[10px] py-[8px]">
      <div>
        <p className="type-body-s text-app-text">{item.name}</p>
        <p className="type-body-xs text-app-text-muted">
          {formatVnd(item.price)}
        </p>
      </div>

      <QuantityControl
        label={item.name}
        quantity={item.quantity}
        onDecrement={() => onUpdate(item.key, -1)}
        onIncrement={() => onUpdate(item.key, 1)}
      />
    </div>
  );
}

function QuantityControl({ label, quantity, onDecrement, onIncrement }) {
  return (
    <div className="flex h-[26px] items-center gap-[6px] rounded-tk-4 bg-app-background px-[6px]">
      <CounterButton
        label={`Remove ${label}`}
        disabled={quantity === 0}
        onClick={onDecrement}
      >
        <Minus className="h-[12px] w-[12px]" />
      </CounterButton>
      <span className="type-body-xs min-w-[12px] text-center text-app-text">
        {quantity}
      </span>
      <CounterButton label={`Add ${label}`} onClick={onIncrement}>
        <Plus className="h-[12px] w-[12px]" />
      </CounterButton>
    </div>
  );
}

function CounterButton({ label, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-[18px] w-[18px] items-center justify-center rounded-tk-4 text-app-text-muted transition-colors hover:bg-app-surface-soft hover:text-brand disabled:cursor-not-allowed disabled:text-neutral-600"
    >
      {children}
    </button>
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

function SummaryRow({ label, value, muted = false }) {
  return (
    <div className="mb-[8px] flex items-start justify-between gap-[16px]">
      <span className="type-body-xs text-app-text-muted">{label}</span>
      {value && (
        <span
          className={
            muted
              ? "type-body-xs text-app-text-muted"
              : "type-body-s text-right text-app-text"
          }
        >
          {value}
        </span>
      )}
    </div>
  );
}
