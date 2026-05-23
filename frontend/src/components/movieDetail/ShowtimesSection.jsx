import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DateChip from "../booking/DateChip";
import TimeSelection from "../booking/TimeSelection";

function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDateParts(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);

  return {
    key: date.toISOString().slice(0, 10),
    day: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    date: date.toLocaleDateString("en-US", { day: "2-digit" }),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
  };
}

export default function ShowtimesSection({ showtimes = [] }) {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(getDateParts(0).key);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState("");

  const dates = useMemo(
    () => Array.from({ length: 7 }).map((_, index) => getDateParts(index)),
    []
  );

  const showtimesForSelectedDate = useMemo(() => {
    const filtered = showtimes.filter((showtime) =>
      showtime.startTime?.startsWith(selectedDate)
    );

    return filtered.length > 0 ? filtered : showtimes;
  }, [showtimes, selectedDate]);

  const uiShowtimes = showtimesForSelectedDate.map((showtime) => ({
    id: showtime.id,
    time: formatTime(showtime.startTime),
  }));

  const firstShowtime = showtimesForSelectedDate[0];

  return (
    <section id="showtimes" className="ticketor-container py-[56px]">
      <div className="mb-[32px]">
        <h2 className="type-h3 text-app-text">Get Ticket</h2>
        <p className="type-body-m mt-[8px] text-app-text-muted">
          Select date, cinema, and showtime.
        </p>
      </div>

      <div className="mb-[32px] flex gap-[12px] overflow-x-auto pb-[8px]">
        {dates.map((item) => (
          <DateChip
            key={item.key}
            day={item.day}
            date={item.date}
            month={item.month}
            selected={selectedDate === item.key}
            onClick={() => {
              setSelectedDate(item.key);
              setSelectedShowtimeId("");
            }}
          />
        ))}
      </div>

      {showtimes.length === 0 ? (
        <div className="rounded-card border border-app-border bg-app-background p-[32px] text-center">
          <p className="type-body-m text-app-text-muted">
            No showtimes are available for this movie yet.
          </p>
        </div>
      ) : (
        <TimeSelection
          cinemaName={firstShowtime?.cinemaName || "Ticketor Cinema"}
          address="Cinema location will be shown here"
          distance="0.20 mi"
          format="Digital 3D"
          showtimes={uiShowtimes}
          selectedShowtimeId={selectedShowtimeId}
          onSelectShowtime={setSelectedShowtimeId}
          onContinue={() => {
            if (selectedShowtimeId) {
              navigate(`/booking/${selectedShowtimeId}`);
            }
          }}
        />
      )}
    </section>
  );
}