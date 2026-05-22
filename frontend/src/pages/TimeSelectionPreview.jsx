import { useState } from "react";
import TimeSelection, { DateChip, TimeChip } from "../components/booking/TimeSelection";

const showtimes = [
  { id: "1", time: "3:10 PM" },
  { id: "2", time: "3:10 PM" },
  { id: "3", time: "3:10 PM" },
  { id: "4", time: "3:10 PM" },
  { id: "5", time: "3:10 PM" },
];

export default function TimeSelectionPreview() {
  const [selectedDate, setSelectedDate] = useState("08");
  const [selectedShowtime, setSelectedShowtime] = useState("");

  return (
    <div className="min-h-screen bg-app-background p-[48px] text-app-text">
      <div className="ticketor-container">
        <h1 className="type-h4 mb-[40px]">Time Selection</h1>

        <section className="mb-[40px]">
          <h2 className="type-h6 mb-[16px]">Date Chips</h2>

          <div className="flex items-center gap-[12px]">
            {["08", "09", "10"].map((date) => (
              <DateChip
                key={date}
                day="TUE"
                date={date}
                month="JUL"
                selected={selectedDate === date}
                onClick={() => setSelectedDate(date)}
              />
            ))}

            <DateChip day="TUE" date="11" month="JUL" disabled />
          </div>
        </section>

        <section className="mb-[40px]">
          <h2 className="type-h6 mb-[16px]">Time Chips</h2>

          <div className="flex items-center gap-[8px]">
            <TimeChip
              time="3:10 PM"
              selected={selectedShowtime === "preview-1"}
              onClick={() => setSelectedShowtime("preview-1")}
            />
            <TimeChip
              time="7:30 PM"
              selected={selectedShowtime === "preview-2"}
              onClick={() => setSelectedShowtime("preview-2")}
            />
            <TimeChip time="9:15 PM" disabled />
          </div>
        </section>

        <section className="grid max-w-[760px] gap-[16px]">
          <TimeSelection
            cinemaName="Regal Gallery Place"
            address="701 Seventh Street Northwest, Washington, DC"
            distance="0.20 mi"
            format="Digital 3D"
            showtimes={showtimes}
            selectedShowtimeId={selectedShowtime}
            onSelectShowtime={setSelectedShowtime}
            onContinue={() => alert(`Continue with showtime ${selectedShowtime}`)}
          />

          <TimeSelection
            cinemaName="Regal Gallery Place"
            address="701 Seventh Street Northwest, Washington, DC"
            distance="0.20 mi"
            format="Digital 3D"
            showtimes={showtimes}
            selectedShowtimeId=""
            disabled
          />
        </section>
      </div>
    </div>
  );
}