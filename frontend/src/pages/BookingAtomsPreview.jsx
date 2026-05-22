import { useState } from "react";
import Checkbox from "../components/common/Checkbox";
import RatingBadge from "../components/common/RatingBadge";
import DateChip from "../components/booking/DateChip";
import TimeChip from "../components/booking/TimeChip";
import SeatButton from "../components/booking/SeatButton";
import SeatMap from "../components/booking/SeatMap";

const sampleSeats = ["A", "B", "C"].flatMap((row) =>
  Array.from({ length: 8 }).map((_, index) => ({
    seatId: `${row}${index + 1}`,
    label: `${row}${index + 1}`,
    booked: row === "B" && [2, 3, 4].includes(index + 1),
  }))
);

export default function BookingAtomsPreview() {
  const [checked, setChecked] = useState(false);
  const [selectedDate, setSelectedDate] = useState("08");
  const [selectedTime, setSelectedTime] = useState("3:10 PM");
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);

  function toggleSeat(seat) {
    const seatId = seat.seatId;

    if (seat.booked) return;

    setSelectedSeatIds((current) =>
      current.includes(seatId)
        ? current.filter((id) => id !== seatId)
        : [...current, seatId]
    );
  }

  return (
    <div className="min-h-screen bg-app-background p-[48px] text-app-text">
      <div className="flex flex-col gap-[48px]">
        <section>
          <h2 className="type-h5 mb-[16px]">Checkbox</h2>

          <div className="flex items-center gap-[24px]">
            <Checkbox checked={checked} onChange={setChecked} label="Information Text" />
            <Checkbox checked label="Checked" />
            <Checkbox error label="Error" />
            <Checkbox disabled label="Disabled" />
          </div>
        </section>

        <section>
          <h2 className="type-h5 mb-[16px]">Rating Badge</h2>

          <div className="flex items-center gap-[24px]">
            <RatingBadge value="7.9" tone="brand" />
            <RatingBadge value="7.9" tone="base" />
            <RatingBadge value="7.9" tone="muted" />
          </div>
        </section>

        <section>
          <h2 className="type-h5 mb-[16px]">Date Chips</h2>

          <div className="flex items-center gap-[12px]">
            {["08", "09", "10"].map((date) => (
              <DateChip
                key={date}
                size="large"
                day="TUE"
                date={date}
                month="JUL"
                selected={selectedDate === date}
                onClick={() => setSelectedDate(date)}
              />
            ))}

            <DateChip size="large" day="TUE" date="11" month="JUL" disabled />

            {["08", "09"].map((date) => (
              <DateChip
                key={`small-${date}`}
                size="small"
                day="TUE"
                date={date}
                selected={selectedDate === date}
                onClick={() => setSelectedDate(date)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="type-h5 mb-[16px]">Time Chips</h2>

          <div className="flex items-center gap-[8px]">
            {["3:10 PM", "5:30 PM", "8:00 PM"].map((time) => (
              <TimeChip
                key={time}
                time={time}
                selected={selectedTime === time}
                onClick={() => setSelectedTime(time)}
              />
            ))}

            <TimeChip time="10:30 PM" disabled />
          </div>
        </section>

        <section>
          <h2 className="type-h5 mb-[16px]">Seat Buttons</h2>

          <div className="flex items-center gap-[12px]">
            <SeatButton label="A1" status="available" />
            <SeatButton label="A2" status="selected" />
            <SeatButton label="A3" status="booked" />
            <SeatButton label="A4" status="disabled" />
          </div>
        </section>

        <section>
          <h2 className="type-h5 mb-[24px]">Seat Map</h2>

          <SeatMap
            seats={sampleSeats}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={toggleSeat}
            columns={8}
          />
        </section>
      </div>
    </div>
  );
}