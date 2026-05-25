import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import DateChip from "../booking/DateChip";
import Button from "../common/Button";

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

  const entryShowtime = showtimesForSelectedDate[0];

  return (
    <section id="showtimes" className="ticketor-container py-[56px]">
      <div className="mb-[32px]">
        <h2 className="type-h3 text-app-text">Get Ticket</h2>
        <p className="type-body-m mt-[8px] text-app-text-muted">
          Select a date first, then continue to choose cinema and showtime.
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

      {showtimes.length === 0 ? (
        <div className="rounded-card border border-app-border bg-app-background p-[32px] text-center">
          <p className="type-body-m text-app-text-muted">
            No showtimes are available for this movie yet.
          </p>
        </div>
      ) : (
        <article className="rounded-tk-8 border border-app-border bg-app-surface p-[24px]">
          <div className="flex flex-col gap-[20px] md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="type-h5 text-app-text">Continue booking</h3>
              <p className="type-body-s mt-[6px] max-w-[520px] text-app-text-muted">
                The next step lets you pick a HCM cinema location and available
                showtime for the selected date.
              </p>
            </div>

            <Button
              size={40}
              variant="primary"
              rightIcon={<ChevronRight />}
              disabled={!entryShowtime}
              onClick={() => {
                if (entryShowtime) {
                  navigate(`/booking/${entryShowtime.id}?date=${selectedDate}`);
                }
              }}
            >
              Continue
            </Button>
          </div>
        </article>
      )}
    </section>
  );
}
