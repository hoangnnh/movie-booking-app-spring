import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Star,
} from "lucide-react";
import { cinemaApi, movieApi, showtimeApi } from "../api/api";
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

const formatFilters = ["All", "Standard", "3D"];

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

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate()
  )}`;
}

function formatLocalDateTime(date) {
  return `${formatDateKey(date)}T${padNumber(date.getHours())}:${padNumber(
    date.getMinutes()
  )}:${padNumber(date.getSeconds())}`;
}

function getDateParts(offset, baseValue = new Date()) {
  const date =
    typeof baseValue === "string"
      ? new Date(`${baseValue.slice(0, 10)}T12:00:00`)
      : new Date(baseValue);
  date.setDate(date.getDate() + offset);

  return {
    key: formatDateKey(date),
    day: offset === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" }),
    date: date.toLocaleDateString("en-US", { day: "2-digit" }),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
  };
}

function getCinemaOffsets(index) {
  const presets = [
    [0, 80, 130, 200],
    [20, 170, 290, 410],
    [35, 180, 360, 480],
    [50, 140, 260, 390],
  ];

  return presets[index % presets.length];
}

function getCinemaFormat(cinema, index) {
  const amenities = Array.isArray(cinema.amenities)
    ? cinema.amenities.join(" ")
    : "";

  if (amenities.includes("IMAX")) return "IMAX";
  if (amenities.includes("4DX")) return "4DX";
  return index % 3 === 0 ? "Digital 3D" : "Standard";
}

function makeStartTimeForDate(sourceStartTime, selectedDate, offset) {
  const source = new Date(sourceStartTime);
  const date = new Date(`${selectedDate}T12:00:00`);

  date.setHours(source.getHours(), source.getMinutes(), 0, 0);
  date.setMinutes(date.getMinutes() + offset);

  return formatLocalDateTime(date);
}

export default function TimeSelectionPage() {
  const { showtimeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [initialShowtime, setInitialShowtime] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getDateParts(0).key);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState(showtimeId);
  const [formatFilter, setFormatFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSelection() {
      try {
        setLoading(true);
        setError("");

        const showtime = await showtimeApi.getById(showtimeId);
        const [movieData, movieShowtimes, cinemaData] = await Promise.all([
          movieApi.getById(showtime.movieId),
          movieApi.getShowtimes(showtime.movieId),
          cinemaApi.getAll(),
        ]);

        setInitialShowtime(showtime);
        setMovie(movieData);
        setShowtimes(movieShowtimes);
        setCinemas(cinemaData);
        setSelectedDate(searchParams.get("date") || showtime.startTime.slice(0, 10));
        setSelectedShowtimeId("");
      } catch {
        setError("Cannot load time selection.");
      } finally {
        setLoading(false);
      }
    }

    loadSelection();
  }, [searchParams, showtimeId]);

  const dates = useMemo(
    () => Array.from({ length: 7 }).map((_, index) => getDateParts(index)),
    []
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

    return cinemas.map((cinema, venueIndex) => {
      const offsets = getCinemaOffsets(venueIndex);
      const times = offsets.map((offset, timeIndex) => {
        const source = baseTimes[timeIndex % baseTimes.length];
        const isRealSource =
          source.id === initialShowtime.id && timeIndex === 0 && venueIndex === 0;
        const startTime = isRealSource
          ? source.startTime
          : makeStartTimeForDate(
              source.startTime,
              selectedDate,
              offset + venueIndex * 15
            );

        return {
          id: isRealSource
            ? source.id
            : `${source.id}-${venueIndex}-${timeIndex}`,
          showtimeId: source.id,
          time: formatTime(startTime),
          startTime,
          cinemaId: cinema.id,
          cinemaName: cinema.name,
          format: getCinemaFormat(cinema, venueIndex),
          synthetic: !isRealSource,
        };
      });

      return {
        ...cinema,
        distance: `${(0.8 + venueIndex * 0.6).toFixed(1)} km`,
        format: getCinemaFormat(cinema, venueIndex),
        times,
      };
    });
  }, [cinemas, initialShowtime, selectedDate, showtimes]);

  const filteredVenueGroups = useMemo(() => {
    if (formatFilter === "All") return venueGroups;

    return venueGroups.filter((venue) => {
      if (formatFilter === "Standard") {
        return venue.format === "Standard";
      }

      return venue.format !== "Standard";
    });
  }, [formatFilter, venueGroups]);

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
    const nextShowtimeId = time?.showtimeId || showtimeId;
    const nextParams = new URLSearchParams({
      date: selectedDate,
    });

    if (time?.startTime) {
      nextParams.set("startTime", time.startTime);
    }

    if (time?.cinemaName) {
      nextParams.set("cinemaName", time.cinemaName);
    }

    navigate(`/booking/${nextShowtimeId}/seats?${nextParams.toString()}`);
  }

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
        <section className="ticketor-container pt-[24px] sm:pt-[32px]">
          <div className="relative overflow-hidden rounded-card border border-app-border bg-app-surface">
            <img
              src={movieView.backdropUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-app-background via-app-background/85 to-app-background/30" />

            <div className="relative z-10 flex flex-col gap-[24px] p-[20px] sm:p-[28px] lg:flex-row lg:gap-[32px] lg:p-[32px]">
              <div className="mx-auto h-[240px] w-[160px] shrink-0 overflow-hidden rounded-tk-8 bg-neutral-700 sm:h-[280px] sm:w-[188px] lg:mx-0">
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
                onClick={() => {
                  setSelectedDate(date.key);
                  setSelectedShowtimeId("");
                }}
              />
            ))}

            <DateUtilityButton icon={<ChevronRight />} label="Next" compact />
          </div>
        </section>

        <section className="ticketor-container pb-[56px]">
          <div className="mb-[16px] flex items-center gap-[16px]">
            {formatFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setFormatFilter(filter);
                  setSelectedShowtimeId("");
                }}
                className={cn(
                  "type-label-s transition-colors",
                  formatFilter === filter
                    ? "text-brand"
                    : "text-app-text-muted hover:text-brand"
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="grid gap-[16px]">
            {filteredVenueGroups.map((venue) => (
              <CinemaTimeCard
                key={`${venue.name}-${venue.distance}`}
                venue={venue}
                selectedShowtimeId={selectedShowtimeId}
                selectedDateLabel={selectedDateLabel}
                onPickTime={(time) => {
                  setSelectedShowtimeId(time.id);
                }}
                onContinue={openTicketModal}
              />
            ))}
          </div>

          {filteredVenueGroups.length === 0 && (
            <div className="rounded-tk-8 border border-app-border bg-app-surface p-[24px] text-center">
              <p className="type-body-m text-app-text-muted">
                No {formatFilter} showtimes are available for this date.
              </p>
            </div>
          )}

          <div className="mt-[40px] flex flex-wrap items-center justify-between gap-[12px]">
            <h2 className="type-h5 text-app-text">Coming Soon</h2>
            <button
              type="button"
              className="type-label-s text-app-text-muted hover:text-brand"
              onClick={() => navigate("/movies?status=coming-soon")}
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
    </div>
  );
}

function DateUtilityButton({ icon, label, compact = false, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-tk-4 border bg-app-surface text-app-text-muted transition-colors hover:border-primary-600 hover:text-primary-600",
        compact ? "h-[56px] w-[40px]" : "h-[56px] min-w-[116px] gap-[8px] px-[14px]",
        "border-app-border"
      )}
    >
      <span className="flex h-[18px] w-[18px] items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]">
        {icon}
      </span>
      {!compact && <span className="type-button-s whitespace-nowrap">{label}</span>}
    </button>
  );
}

function CinemaTimeCard({
  venue,
  selectedShowtimeId,
  selectedDateLabel,
  onPickTime,
  onContinue,
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

            if (activeTime) onContinue(activeTime);
          }}
        >
          Continue
        </Button>
      </div>
    </article>
  );
}
