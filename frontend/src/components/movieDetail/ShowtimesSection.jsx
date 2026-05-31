import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DateChip from "../booking/DateChip";

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

export default function ShowtimesSection({ showtimes = [], bookingAvailable = true }) {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(getDateParts(0).key);

  const dates = useMemo(
    () => Array.from({ length: 7 }).map((_, index) => getDateParts(index)),
    []
  );

  const showtimesForSelectedDate = useMemo(() => {
    return showtimes.filter((showtime) =>
      showtime.startTime?.startsWith(selectedDate)
    );
  }, [showtimes, selectedDate]);

  const showtimesByCinema = useMemo(() => {
    return showtimesForSelectedDate.reduce((groups, showtime) => {
      const cinemaName = showtime.cinemaName || "Cinema";
      const roomName = showtime.roomName || "Standard";
      const cinemaRooms = groups.get(cinemaName) || new Map();
      const roomShowtimes = cinemaRooms.get(roomName) || [];

      roomShowtimes.push(showtime);
      cinemaRooms.set(roomName, roomShowtimes);
      groups.set(cinemaName, cinemaRooms);

      return groups;
    }, new Map());
  }, [showtimesForSelectedDate]);

  return (
    <section id="showtimes" className="ticketor-container py-[56px]">
      <div className="mb-[32px]">
        <h2 className="type-h3 text-app-text">Get Ticket</h2>
        <p className="type-body-m mt-[8px] text-app-text-muted">
          Select a date, cinema, and showtime to continue booking.
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
            }}
          />
        ))}
      </div>

      {!bookingAvailable ? (
        <div className="rounded-card border border-app-border bg-app-background p-[32px] text-center">
          <p className="type-body-m text-app-text-muted">
            This movie is not currently available for booking.
          </p>
        </div>
      ) : showtimes.length === 0 ? (
        <div className="rounded-card border border-app-border bg-app-background p-[32px] text-center">
          <p className="type-body-m text-app-text-muted">
            No showtimes are available for this movie yet.
          </p>
        </div>
      ) : showtimesForSelectedDate.length === 0 ? (
        <div className="rounded-card border border-app-border bg-app-background p-[32px] text-center">
          <p className="type-body-m text-app-text-muted">
            No showtimes are available for this date.
          </p>
        </div>
      ) : (
        <div className="grid gap-[16px]">
          {Array.from(showtimesByCinema.entries()).map(([cinemaName, cinemaRooms]) => (
            <article
              key={cinemaName}
              className="rounded-tk-8 border border-app-border bg-app-surface p-[24px]"
            >
              <h3 className="type-h5 text-app-text">{cinemaName}</h3>

              <div className="mt-[16px] grid gap-[16px]">
                {Array.from(cinemaRooms.entries()).map(([roomName, roomShowtimes]) => (
                  <div
                    key={roomName}
                    className="flex flex-wrap items-center gap-[12px]"
                  >
                    <span className="w-[120px] type-body-s text-app-text-muted">
                      {roomName}
                    </span>

                    {roomShowtimes.map((showtime) => (
                      <button
                        key={showtime.id}
                        type="button"
                        onClick={() => {
                          const nextParams = new URLSearchParams({
                            date: selectedDate,
                            cinemaName,
                          });

                          navigate(`/booking/${showtime.id}/seats?${nextParams.toString()}`);
                        }}
                        className="min-w-[96px] rounded-tk-4 border border-app-border bg-app-background px-[14px] py-[10px] type-body-s text-app-text transition-colors hover:border-brand hover:text-brand"
                      >
                        {formatTime(showtime.startTime)}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
