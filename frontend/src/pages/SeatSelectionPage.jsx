import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
} from "lucide-react";
import { bookingApi, movieApi, showtimeApi } from "../api/api";
import BookingProgress from "../components/booking/BookingProgress";
import SeatMap from "../components/booking/SeatMap";
import Button from "../components/common/Button";
import { formatDuration, getPosterUrl } from "../components/home/homeUtils";
import { formatVnd } from "../utils/currency";
import { getMovieBookingPath } from "../utils/moviePath";

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

function getSeatId(seat) {
  return String(seat.seatId || seat.id);
}

function findSeatSpacingViolation(seats, selectedSeatIds) {
  const selectedIds = new Set(selectedSeatIds.map(String));
  const seatsByRow = seats.reduce((rows, seat) => {
    const rowName = seat.rowName || "";
    return rows.set(rowName, [...(rows.get(rowName) || []), seat]);
  }, new Map());

  for (const rowSeats of seatsByRow.values()) {
    const sortedSeats = [...rowSeats].sort(
      (left, right) => Number(left.seatNumber) - Number(right.seatNumber)
    );
    let gapStart = -1;

    for (let index = 0; index <= sortedSeats.length; index += 1) {
      const seat = sortedSeats[index];
      const occupied = seat
        ? seat.booked || selectedIds.has(getSeatId(seat))
        : true;

      if (!occupied && gapStart === -1) {
        gapStart = index;
      }

      if ((occupied || index === sortedSeats.length) && gapStart !== -1) {
        const gapEnd = index - 1;
        const gapLength = gapEnd - gapStart + 1;
        const leftSeat = sortedSeats[gapStart - 1];
        const rightSeat = sortedSeats[gapEnd + 1];
        const touchesSelectedSeat =
          (leftSeat && selectedIds.has(getSeatId(leftSeat))) ||
          (rightSeat && selectedIds.has(getSeatId(rightSeat)));

        if (gapLength === 1 && touchesSelectedSeat) {
          return {
            type: "single",
            seatLabel: sortedSeats[gapStart].label,
          };
        }

        gapStart = -1;
      }
    }
  }

  return null;
}

export default function SeatSelectionPage() {
  const { showtimeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedDateParam = searchParams.get("date") || "";
  const selectedStartTimeParam = searchParams.get("startTime") || "";
  const selectedCinemaNameParam = searchParams.get("cinemaName") || "";
  const selectedSeatParam = searchParams.get("seats") || "";

  const [movie, setMovie] = useState(null);
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState(() =>
    selectedSeatParam
      .split(",")
      .map((seatId) => seatId.trim())
      .filter(Boolean)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSeatSelection() {
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
      } catch (loadError) {
        setError(loadError?.message || "Cannot load seat selection.");
      } finally {
        setLoading(false);
      }
    }

    loadSeatSelection();
  }, [showtimeId]);

  const movieView = useMemo(() => {
    if (!movie) return null;

    return {
      title: movie.title,
      posterUrl: getPosterUrl(movie, 0),
      duration: formatDuration(movie.durationMinutes),
      genres: Array.isArray(movie.genres) ? movie.genres.join(", ") : "Drama",
      ageRating: movie.ageRating || "T13",
      rating: movie.rating || movie.voteAverage || "N/A",
    };
  }, [movie]);

  const timeView = useMemo(() => {
    if (!showtime && !selectedStartTimeParam) return null;

    return formatDateTime(selectedStartTimeParam || showtime.startTime);
  }, [selectedStartTimeParam, showtime]);

  const displayCinemaName = selectedCinemaNameParam || showtime?.cinemaName || "";

  const selectedSeats = seats.filter((seat) =>
    selectedSeatIds.includes(getSeatId(seat))
  );

  const ticketCount = selectedSeatIds.length;
  const ticketUnitPrice = Number(showtime?.price) || 0;
  const totalAmount = ticketCount * ticketUnitPrice;
  const seatSpacingViolation = findSeatSpacingViolation(seats, selectedSeatIds);
  const selectionComplete = ticketCount > 0 && !seatSpacingViolation;
  const nextSelectedSeatParam = selectedSeatIds.join(",");

  function toggleSeat(seat) {
    const seatId = getSeatId(seat);

    if (seat.booked) return;

    setSelectedSeatIds((current) => {
      if (current.includes(seatId)) {
        return current.filter((id) => id !== seatId);
      }

      return [...current, seatId];
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-app-background text-app-text">
        <main className="ticketor-container py-[80px]">
          <p className="type-body-m text-app-text-muted">Loading seats...</p>
        </main>
      </div>
    );
  }

  if (error || !movieView || !showtime || !timeView) {
    return (
      <div className="min-h-screen bg-app-background text-app-text">
        <main className="ticketor-container py-[80px]">
          <div className="rounded-card border border-error-500 bg-app-background p-[24px] text-error-500">
            {error || "Seat selection is unavailable."}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[20px] sm:py-[28px]">
        <button
          type="button"
          className="mb-[18px] inline-flex items-center gap-[8px] type-body-s text-app-text-muted transition-colors hover:text-brand"
          onClick={() =>
            navigate(
              `${getMovieBookingPath(movie)}${
                selectedDateParam ? `?date=${encodeURIComponent(selectedDateParam)}` : ""
              }`
            )
          }
        >
          <ChevronLeft className="h-[16px] w-[16px]" />
          Back to movie showtimes
        </button>

        <div className="grid gap-[20px] xl:grid-cols-[220px_minmax(0,1fr)_250px]">
          <aside className="xl:order-1">
            <div className="sticky top-[24px] overflow-hidden border border-app-border bg-black/35">
              <div className="p-[14px] pb-[10px]">
                <h1 className="type-h5 text-app-text">{movieView.title}</h1>
                <div className="mt-[6px] flex flex-wrap items-center gap-[7px] type-body-xs text-app-text-muted">
                  <span>{movieView.duration}</span>
                  <span>/</span>
                  <span>{movieView.ageRating}</span>
                  <span>/</span>
                  <span className="inline-flex items-center gap-[4px]">
                    <Star className="h-[12px] w-[12px] fill-app-text text-app-text" />
                    {movieView.rating}
                  </span>
                </div>
              </div>

              <img
                src={movieView.posterUrl}
                alt={movieView.title}
                className="h-[300px] w-full object-cover"
              />

              <div className="p-[14px]">
                <p className="type-body-xs text-app-text">{displayCinemaName}</p>
                <p className="type-body-xs mt-[4px] text-secondary-600">{showtime.roomName}</p>
                <div className="mt-[14px] flex items-center gap-[6px] type-body-xs text-app-text-muted">
                  <MapPin className="h-[13px] w-[13px]" />
                  <span>{timeView.date}, {timeView.time}</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="xl:order-2 min-w-0">
            <BookingProgress currentStep={0} className="mb-[28px]" />

            <div className="min-h-[440px] bg-black/25 px-[18px] py-[28px]">
              <SeatMap
                seats={seats}
                selectedSeatIds={selectedSeatIds}
                onToggleSeat={toggleSeat}
                columns={8}
                size="theater"
                variant="theater"
              />

              {ticketCount === 0 && (
                <p className="type-body-xs mt-[20px] text-center text-app-text-muted">
                  Select at least one seat to continue.
                </p>
              )}

              {seatSpacingViolation && (
                <p className="type-body-xs mx-auto mt-[20px] max-w-[540px] rounded-tk-4 border border-error-500 bg-app-background px-[12px] py-[10px] text-center text-error-500">
                  Seat {seatSpacingViolation.seatLabel} cannot be left as a single empty seat next to your selection.
                </p>
              )}
            </div>
          </section>

          <aside className="xl:order-3 xl:pt-[88px]">
            <div className="sticky top-[24px] p-[4px]">
              <h2 className="type-body-s text-app-text">Selected Seats</h2>

              <div className="mt-[14px] rounded-tk-4 border border-app-border bg-black/25 px-[12px] py-[11px]">
                <div className="flex items-center justify-between">
                  <span className="type-body-xs text-app-text-muted">Tickets</span>
                  <span className="type-body-s text-app-text">{ticketCount}</span>
                </div>
              </div>

              <div className="mt-[14px] min-h-[56px] border-b border-app-border pb-[14px]">
                {selectedSeats.length > 0 ? (
                  <p className="type-body-xs leading-5 text-secondary-600">
                    {selectedSeats.map((seat) => seat.label).join(", ")}
                  </p>
                ) : (
                  <p className="type-body-xs text-app-text-muted">No seats selected yet.</p>
                )}
              </div>

              <div className="mt-[16px] flex items-center justify-between">
                <span className="type-body-xs text-app-text">Total Payment</span>
                <span className="type-body-s text-app-text">{formatVnd(totalAmount)}</span>
              </div>

              <Button
                size={48}
                variant="primary"
                rightIcon={<ChevronRight />}
                disabled={!selectionComplete}
                className="mt-[20px] w-full"
                onClick={() =>
                  {
                    const nextParams = new URLSearchParams({
                      tickets: String(ticketCount),
                      seats: nextSelectedSeatParam,
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

                    navigate(`/booking/${showtimeId}/food?${nextParams.toString()}`);
                  }
                }
              >
                Add to Cart
              </Button>

              <Button
                size={40}
                variant="outline"
                tone="base"
                className="mt-[10px] w-full"
                onClick={() =>
                  navigate(
                    `${getMovieBookingPath(movie)}${
                      selectedDateParam ? `?date=${encodeURIComponent(selectedDateParam)}` : ""
                    }`
                  )
                }
              >
                Cancel
              </Button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
