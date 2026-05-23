import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Minus,
  Plus,
  Star,
  X,
} from "lucide-react";
import { movieApi, showtimeApi } from "../api/api";
import Button from "../components/common/Button";
import Footer from "../components/layout/Footer";
import DateChip from "../components/booking/DateChip";
import TimeChip from "../components/booking/TimeChip";
import MovieCard from "../components/movie/MovieCard";
import { fallbackPosters, heroImage } from "../components/home/homeData";
import {
  formatDuration,
  getPosterUrl,
  normalizeMovie,
} from "../components/home/homeUtils";
import { cn } from "../utils/cn";

const venueTemplates = [
  {
    name: "Regal Gallery Place",
    address: "701 Seventh Street Northwest, Washington, DC",
    distance: "0.20 mi",
    format: "Digital 3D",
    offsets: [0, 80, 130, 200],
  },
  {
    name: "Regal Majestic & IMAX",
    address: "900 Ellsworth Drive, Silver Spring, MD",
    distance: "1.5 mi",
    format: "Digital 3D",
    offsets: [20, 170, 290, 410],
  },
  {
    name: "AMC Hoffman Center 22",
    address: "206 Swamp Fox Road, Alexandria, VA",
    distance: "3.5 mi",
    format: "Standard",
    offsets: [35, 180, 360, 480],
  },
  {
    name: "Regal Majestic & IMAX",
    address: "900 Ellsworth Drive, Silver Spring, MD",
    distance: "7 mi",
    format: "Digital 3D",
    offsets: [50, 140, 260, 390],
  },
];

const ticketTypes = [
  { key: "adult", label: "Adult", price: 18.07 },
  { key: "senior", label: "Senior", price: 16.95 },
  { key: "child", label: "Child", price: 12.07 },
];

function addMinutes(value, minutes) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLabel(value) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDateParts(offset, baseValue = new Date()) {
  const date = new Date(baseValue);
  date.setDate(date.getDate() + offset);

  return {
    key: date.toISOString().slice(0, 10),
    day: offset === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" }),
    date: date.toLocaleDateString("en-US", { day: "2-digit" }),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
  };
}

function getTicketTotal(counts) {
  return ticketTypes.reduce(
    (total, type) => total + counts[type.key] * type.price,
    0
  );
}

export default function TimeSelectionPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [initialShowtime, setInitialShowtime] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getDateParts(0).key);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState(showtimeId);
  const [selectedTime, setSelectedTime] = useState(null);
  const [ticketCounts, setTicketCounts] = useState({
    adult: 0,
    senior: 0,
    child: 0,
  });
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSelection() {
      try {
        setLoading(true);
        setError("");

        const showtime = await showtimeApi.getById(showtimeId);
        const [movieData, movieShowtimes] = await Promise.all([
          movieApi.getById(showtime.movieId),
          movieApi.getShowtimes(showtime.movieId),
        ]);

        setInitialShowtime(showtime);
        setMovie(movieData);
        setShowtimes(movieShowtimes);
        setSelectedDate(showtime.startTime.slice(0, 10));
        setSelectedShowtimeId(showtime.id);
        setSelectedTime({
          id: showtime.id,
          time: formatTime(showtime.startTime),
          startTime: showtime.startTime,
          cinemaName: showtime.cinemaName,
          format: "Digital 3D",
        });
      } catch {
        setError("Cannot load time selection.");
      } finally {
        setLoading(false);
      }
    }

    loadSelection();
  }, [showtimeId]);

  const dates = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, index) =>
        getDateParts(index, initialShowtime?.startTime || new Date())
      ),
    [initialShowtime]
  );

  const selectedDateLabel = useMemo(
    () => formatDateLabel(`${selectedDate}T12:00:00`),
    [selectedDate]
  );

  const movieView = useMemo(() => {
    if (!movie) return null;

    return {
      ...normalizeMovie(movie),
      posterUrl: getPosterUrl(movie, 0),
      backdropUrl: getPosterUrl(movie, 1),
      duration: formatDuration(movie.durationMinutes),
      genres: Array.isArray(movie.genres) ? movie.genres.join(", ") : "Drama",
      rating: movie.rating || "7.9",
    };
  }, [movie]);

  const venueGroups = useMemo(() => {
    if (!initialShowtime) return [];

    const selectedDayShowtimes = showtimes.filter((showtime) =>
      showtime.startTime?.startsWith(selectedDate)
    );
    const baseTimes = selectedDayShowtimes.length
      ? selectedDayShowtimes
      : [initialShowtime];

    return venueTemplates.map((venue, venueIndex) => {
      const times = venue.offsets.map((offset, timeIndex) => {
        const source = baseTimes[timeIndex % baseTimes.length];
        const isRealSource = source.id === initialShowtime.id && timeIndex === 0;
        const startTime = isRealSource
          ? source.startTime
          : addMinutes(source.startTime, offset + venueIndex * 15);

        return {
          id: isRealSource
            ? source.id
            : `${source.id}-${venueIndex}-${timeIndex}`,
          showtimeId: source.id,
          time: formatTime(startTime),
          startTime,
          cinemaName: venue.name,
          format: venue.format,
          synthetic: !isRealSource,
        };
      });

      return {
        ...venue,
        times,
      };
    });
  }, [initialShowtime, selectedDate, showtimes]);

  const comingSoonMovies = useMemo(() => {
    if (!movieView) return [];

    return fallbackPosters.map((posterUrl, index) => ({
      ...movieView,
      id: `${movieView.id}-related-${index}`,
      posterUrl,
      title: index === 0 ? movieView.title : "The Dark Knight",
      releaseDate: movieView.releaseDate,
    }));
  }, [movieView]);

  function openTicketModal(time) {
    setSelectedShowtimeId(time.id);
    setSelectedTime(time);
    setTicketModalOpen(true);
  }

  function updateTicketCount(type, direction) {
    setTicketCounts((current) => ({
      ...current,
      [type]: Math.max(0, Math.min(9, current[type] + direction)),
    }));
  }

  const totalTickets = Object.values(ticketCounts).reduce(
    (total, count) => total + count,
    0
  );
  const totalAmount = getTicketTotal(ticketCounts);

  if (loading) {
    return (
      <div className="min-h-screen bg-app-background text-app-text">
        <main className="ticketor-container py-[80px]">
          <p className="type-body-m text-app-text-muted">Loading time selection...</p>
        </main>
      </div>
    );
  }

  if (error || !movieView) {
    return (
      <div className="min-h-screen bg-app-background text-app-text">
        <main className="ticketor-container py-[80px]">
          <div className="rounded-card border border-error-500 bg-app-background p-[24px] text-error-500">
            {error || "Movie not found."}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main>
        <section className="ticketor-container pt-[32px]">
          <div className="relative overflow-hidden rounded-card border border-app-border bg-app-surface">
            <img
              src={movieView.backdropUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-app-background via-app-background/85 to-app-background/30" />

            <div className="relative z-10 flex gap-[32px] p-[32px]">
              <div className="h-[280px] w-[188px] shrink-0 overflow-hidden rounded-tk-8 bg-neutral-700">
                <img
                  src={movieView.posterUrl}
                  alt={movieView.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex max-w-[720px] flex-col justify-center">
                <h1 className="type-h3 text-app-text">{movieView.title}</h1>

                <div className="mt-[8px] flex flex-wrap items-center gap-[12px] text-app-text-muted">
                  <span className="type-body-s">{movieView.duration}</span>
                  <span className="rounded-tk-4 border border-app-border px-[8px] py-[3px] type-body-xs">
                    PG
                  </span>
                  <span className="inline-flex items-center gap-[4px] text-app-text">
                    <Star className="h-[14px] w-[14px] fill-brand text-brand" />
                    <span className="type-body-s">{movieView.rating}</span>
                  </span>
                </div>

                <p className="type-body-m mt-[16px] max-w-[620px] text-app-text-muted">
                  {movie.description}
                </p>

                <button
                  type="button"
                  className="type-label-s mt-[10px] w-fit text-secondary-600 hover:text-secondary-500"
                >
                  More Details
                </button>

                <Button
                  size={40}
                  variant="outline"
                  tone="brand"
                  className="mt-[24px] w-fit"
                >
                  Add to my list
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="ticketor-container py-[24px]">
          <div className="flex items-center gap-[12px] overflow-x-auto pb-[4px]">
            <DateUtilityButton icon={<Filter />} label="Filters" />
            <DateUtilityButton icon={<ChevronLeft />} label="Previous" compact />

            {dates.map((date) => (
              <DateChip
                key={date.key}
                day={date.day}
                date={date.date}
                month={date.month}
                size="large"
                selected={selectedDate === date.key}
                onClick={() => setSelectedDate(date.key)}
              />
            ))}

            <DateUtilityButton icon={<ChevronRight />} label="Next" compact />
            <DateUtilityButton icon={<CalendarDays />} label="Calendar" />
          </div>
        </section>

        <section className="ticketor-container pb-[56px]">
          <div className="mb-[28px] flex flex-wrap items-center gap-[16px] rounded-tk-8 border border-app-border bg-app-background p-[16px]">
            <label className="flex items-center gap-[12px]">
              <span className="type-body-xs text-app-text-muted">Select location</span>
              <select className="h-[32px] min-w-[180px] rounded-tk-4 border border-app-border bg-app-background px-[12px] type-body-xs text-app-text outline-none">
                <option>Washington</option>
              </select>
            </label>

            <label className="flex items-center gap-[12px]">
              <span className="type-body-xs text-app-text-muted">Select Cinema</span>
              <select className="h-[32px] min-w-[180px] rounded-tk-4 border border-app-border bg-app-background px-[12px] type-body-xs text-app-text outline-none">
                <option>Any Cinema</option>
              </select>
            </label>
          </div>

          <div className="mb-[16px] flex items-center gap-[16px]">
            <span className="type-label-s text-brand">All</span>
            <span className="type-label-s text-app-text-muted">Standard</span>
            <span className="type-label-s text-app-text-muted">3D</span>
          </div>

          <div className="grid gap-[16px]">
            {venueGroups.map((venue) => (
              <CinemaTimeCard
                key={`${venue.name}-${venue.distance}`}
                venue={venue}
                selectedShowtimeId={selectedShowtimeId}
                selectedDateLabel={selectedDateLabel}
                onPickTime={openTicketModal}
              />
            ))}
          </div>

          <div className="mt-[40px] flex items-center justify-between">
            <h2 className="type-h5 text-app-text">Coming Soon</h2>
            <button
              type="button"
              className="type-label-s text-app-text-muted hover:text-brand"
            >
              View all
            </button>
          </div>

          <div className="mt-[16px] flex gap-[16px] overflow-x-auto pb-[8px]">
            {comingSoonMovies.map((item, index) => (
              <MovieCard
                key={item.id}
                title={item.title}
                genres={item.genres}
                duration={item.duration}
                rating={item.rating}
                ageRating="PG"
                posterUrl={item.posterUrl}
                status="coming-soon"
                releaseText={
                  index === 0
                    ? `Showing ${selectedDateLabel}`
                    : "Releases March 15, 2025"
                }
                onTrailer={() => {}}
              />
            ))}
          </div>
        </section>
      </main>

      <Footer heroImageUrl={heroImage} />

      {ticketModalOpen && (
        <TicketModal
          movieTitle={movieView.title}
          selectedTime={selectedTime}
          ticketCounts={ticketCounts}
          totalTickets={totalTickets}
          totalAmount={totalAmount}
          onClose={() => setTicketModalOpen(false)}
          onContinue={() => {
            const nextShowtimeId = selectedTime?.showtimeId || showtimeId;
            navigate(`/booking/${nextShowtimeId}/seats?tickets=${totalTickets}`);
          }}
          onUpdateTicketCount={updateTicketCount}
        />
      )}
    </div>
  );
}

function DateUtilityButton({ icon, label, compact = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-tk-4 border border-app-border bg-app-surface text-app-text-muted transition-colors hover:border-primary-600 hover:text-primary-600",
        compact ? "h-[56px] w-[32px]" : "h-[56px] w-[72px] gap-[6px]"
      )}
    >
      <span className="flex h-[16px] w-[16px] items-center justify-center">
        {icon}
      </span>
      {!compact && <span className="type-label-s">{label}</span>}
    </button>
  );
}

function CinemaTimeCard({
  venue,
  selectedShowtimeId,
  selectedDateLabel,
  onPickTime,
}) {
  const hasSelected = venue.times.some((time) => time.id === selectedShowtimeId);

  return (
    <article className="rounded-tk-8 border border-app-border bg-app-surface p-[20px]">
      <div className="flex items-start justify-between gap-[24px]">
        <div>
          <h3 className="type-h6 text-app-text">{venue.name}</h3>
          <div className="mt-[4px] flex items-center gap-[6px] text-secondary-600">
            <MapPin className="h-[14px] w-[14px]" />
            <p className="type-body-xs">
              {venue.address}, {selectedDateLabel}
            </p>
          </div>
        </div>

        <span className="type-body-xs text-app-text-muted">{venue.distance}</span>
      </div>

      <div className="mt-[28px]">
        <h4 className="type-h6 text-app-text">{venue.format}</h4>
        <p className="type-body-xs mt-[4px] text-app-text-muted">
          Reserved seating . Closed caption . Accessibility devices available
        </p>

        <div className="mt-[14px] flex flex-wrap gap-[8px]">
          {venue.times.map((time) => (
            <TimeChip
              key={time.id}
              time={time.time}
              selected={selectedShowtimeId === time.id}
              onClick={() => onPickTime(time)}
            />
          ))}
        </div>
      </div>

      <div className="mt-[20px] flex justify-end">
        <Button
          size={32}
          variant="primary"
          rightIcon={<ChevronRight />}
          disabled={!hasSelected}
          onClick={() => {
            const activeTime = venue.times.find(
              (time) => time.id === selectedShowtimeId
            );

            if (activeTime) onPickTime(activeTime);
          }}
        >
          Continue
        </Button>
      </div>
    </article>
  );
}

function TicketModal({
  movieTitle,
  selectedTime,
  ticketCounts,
  totalTickets,
  totalAmount,
  onClose,
  onContinue,
  onUpdateTicketCount,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-[24px] pt-[12vh]">
      <div className="w-full max-w-[560px] rounded-tk-8 border border-app-border bg-app-surface p-[24px] shadow-2xl">
        <div className="flex items-start justify-between gap-[16px]">
          <div>
            <div className="flex items-center gap-[8px]">
              <span className="h-[8px] w-[8px] rounded-sm bg-brand" />
              <h2 className="type-h6 text-app-text">Choose Tickets For Everyone</h2>
            </div>
            <p className="type-body-xs mt-[4px] text-app-text-muted">
              Select the number of tickets for {movieTitle}
              {selectedTime ? ` at ${selectedTime.time}` : ""}.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close"
            className="text-app-text-muted hover:text-app-text"
            onClick={onClose}
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="mt-[20px] grid gap-[8px]">
          {ticketTypes.map((type) => (
            <div
              key={type.key}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-[16px] rounded-tk-4 border border-app-border bg-app-background px-[12px] py-[10px]"
            >
              <div>
                <p className="type-body-s text-app-text">{type.label}</p>
                <p className="type-body-xs text-app-text-muted">
                  ${type.price.toFixed(2)}
                </p>
              </div>

              <div className="type-body-s min-w-[24px] text-center text-app-text">
                {ticketCounts[type.key]}
              </div>

              <div className="flex items-center gap-[6px]">
                <CounterButton
                  label={`Remove ${type.label}`}
                  disabled={ticketCounts[type.key] === 0}
                  onClick={() => onUpdateTicketCount(type.key, -1)}
                >
                  <Minus className="h-[14px] w-[14px]" />
                </CounterButton>
                <CounterButton
                  label={`Add ${type.label}`}
                  onClick={() => onUpdateTicketCount(type.key, 1)}
                >
                  <Plus className="h-[14px] w-[14px]" />
                </CounterButton>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[18px] flex items-center justify-between">
          <div className="type-body-xs text-app-text-muted">
            {totalTickets} ticket{totalTickets === 1 ? "" : "s"} . $
            {totalAmount.toFixed(2)}
          </div>

          <div className="flex items-center gap-[8px]">
            <Button size={32} variant="outline" tone="base" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size={32}
              variant="primary"
              rightIcon={<ChevronRight />}
              disabled={totalTickets === 0}
              onClick={onContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
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
      className="flex h-[24px] w-[24px] items-center justify-center rounded-tk-4 border border-app-border text-app-text-muted transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:border-neutral-600 disabled:text-neutral-500"
    >
      {children}
    </button>
  );
}
