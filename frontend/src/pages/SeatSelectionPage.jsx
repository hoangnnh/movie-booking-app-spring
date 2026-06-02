import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Ticket,
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
      <main className="ticketor-container py-[24px] sm:py-[40px]">
        <button
          type="button"
          className="mb-[32px] inline-flex items-center gap-[8px] type-body-s text-app-text-muted transition-colors hover:text-brand"
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

        <BookingProgress currentStep={0} className="mb-[32px] sm:mb-[56px]" />

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
              </div>
            </div>
          </aside>

          <section className="xl:order-2 rounded-tk-8 border border-app-border bg-app-surface p-[20px] sm:p-[24px] lg:p-[32px]">
            <div className="mb-[32px] text-center">
              <p className="type-label-s text-brand">Seat Selection</p>
              <h2 className="type-h4 mt-[4px] text-app-text">
                Choose Your Seats
              </h2>
              <p className="type-body-s mt-[8px] text-app-text-muted">
                Select the seats you want. Ticket quantity is counted from your selected seats.
              </p>
            </div>

            <SeatMap
              seats={seats}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={toggleSeat}
              columns={8}
              size="lg"
            />

            {ticketCount === 0 && (
              <p className="type-body-xs mt-[20px] text-center text-app-text-muted">
                Select at least one seat to continue.
              </p>
            )}

            {seatSpacingViolation && (
              <p className="type-body-xs mt-[20px] rounded-tk-4 border border-error-500 bg-app-background px-[12px] py-[10px] text-center text-error-500">
                Seat {seatSpacingViolation.seatLabel} cannot be left as a single empty seat next to your selection.
              </p>
            )}
          </section>

          <aside className="xl:order-3">
            <div className="sticky top-[24px] rounded-tk-8 border border-app-border bg-app-surface p-[24px]">
              <div className="flex items-center gap-[10px]">
                <Ticket className="h-[20px] w-[20px] text-brand" />
                <h2 className="type-h5 text-app-text">Order Details</h2>
              </div>

              <div className="mt-[24px] grid gap-[16px]">
                <SummaryRow label="Movie" value={movieView.title} />
                <SummaryRow label="Duration" value={movieView.duration} />
                <SummaryRow label="Cinema" value={displayCinemaName} />
                <SummaryRow label="Room" value={showtime.roomName} />
                <SummaryRow
                  label="Tickets"
                  value={`${ticketCount} x ${formatVnd(ticketUnitPrice)}`}
                />
              </div>

              <div className="mt-[24px] border-t border-app-border pt-[20px]">
                <p className="type-body-xs text-app-text-muted">Selected Seats</p>
                <div className="mt-[8px] min-h-[40px]">
                  {selectedSeats.length > 0 ? (
                    <div className="flex flex-wrap gap-[8px]">
                      {selectedSeats.map((seat) => (
                        <span
                          key={getSeatId(seat)}
                          className="rounded-tk-4 bg-primary-600 px-[10px] py-[5px] type-label-s text-neutral-900"
                        >
                          {seat.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="type-body-s text-app-text-muted">
                      No seats selected yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-[24px] border-t border-app-border pt-[20px]">
                <div className="flex items-center justify-between">
                  <span className="type-body-s text-app-text-muted">Total</span>
                  <span className="type-h5 text-app-text">
                    {formatVnd(totalAmount)}
                  </span>
                </div>
              </div>

              <Button
                size={48}
                variant="primary"
                rightIcon={<ChevronRight />}
                disabled={!selectionComplete}
                className="mt-[24px] w-full"
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
                Continue
              </Button>
            </div>
          </aside>
        </div>
      </main>
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
