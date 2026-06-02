import SeatButton from "./SeatButton";
import { cn } from "../../utils/cn";

export default function SeatMap({
  seats = [],
  selectedSeatIds = [],
  onToggleSeat,
  columns = 8,
  size = "md",
  variant = "default",
  className = "",
}) {
  const seatRows = groupSeatsByRow(seats, columns);
  const isTheater = variant === "theater";

  return (
    <div className={cn("w-full", className)}>
      {isTheater ? (
        <div className="mb-[34px] flex justify-center">
          <div className="w-[72%]">
            <div className="h-[38px] bg-neutral-600 [clip-path:polygon(0_0,100%_0,86%_100%,14%_100%)]" />
            <p className="mt-[-25px] text-center type-body-xs text-neutral-300">Stage</p>
          </div>
        </div>
      ) : (
        <div className="mb-[24px] flex justify-center sm:mb-[32px]">
          <div className="w-[90%] rounded-full border-t border-primary-600 pt-[12px] text-center type-label-s text-app-text-muted sm:w-[70%]">
            SCREEN
          </div>
        </div>
      )}

      <div className="overflow-x-auto pb-[6px]">
        <div className={cn("mx-auto flex w-fit min-w-max flex-col", isTheater ? "gap-[11px]" : "gap-[8px] sm:gap-[12px]")}>
          {seatRows.map(([rowName, rowSeats], rowIndex) => (
            <div
              key={rowName}
              className={cn("flex items-center", isTheater ? "gap-[5px]" : "gap-[8px] sm:gap-[12px]", isTheater && rowIndex === 5 && "mt-[14px]")}
            >
              {isTheater && <span className="w-[14px] text-right type-body-xs text-app-text">{rowName}</span>}
              {rowSeats.map((seat) => {
                const seatId = seat.seatId || seat.id;
                const isSelected = selectedSeatIds.map(String).includes(String(seatId));

                let status = "available";

                if (seat.booked) {
                  status = "booked";
                } else if (seat.disabled) {
                  status = "disabled";
                } else if (isSelected) {
                  status = "selected";
                }

                return (
                  <SeatButton
                    key={seatId}
                    label={seat.label}
                    status={status}
                    size={size}
                    hideLabel={isTheater}
                    onClick={() => onToggleSeat?.(seat)}
                  />
                );
              })}
              {isTheater && <span className="w-[14px] type-body-xs text-app-text">{rowName}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className={cn("flex flex-wrap justify-center gap-[16px]", isTheater ? "mt-[28px]" : "mt-[24px] sm:mt-[32px] sm:gap-[24px]")}>
        <LegendItem status="available" label="Available" size={isTheater ? "theater" : "sm"} />
        <LegendItem status="selected" label="Selected" size={isTheater ? "theater" : "sm"} />
        <LegendItem status="booked" label={isTheater ? "Reserved" : "Booked"} size={isTheater ? "theater" : "sm"} />
        {isTheater && <LegendItem status="disabled" label="Unavailable" size="theater" />}
      </div>
    </div>
  );
}

function groupSeatsByRow(seats, columns) {
  const rows = new Map();

  seats.forEach((seat, index) => {
    const rowName = seat.rowName
      || seat.label?.match(/^[^\d]+/)?.[0]
      || `row-${Math.floor(index / columns)}`;

    rows.set(rowName, [...(rows.get(rowName) || []), seat]);
  });

  return [...rows.entries()];
}

function LegendItem({ status, label, size }) {
  return (
    <div className="flex items-center gap-[8px]">
      <SeatButton label="" status={status} size={size} hideLabel />
      <span className="type-body-xs text-app-text-muted">{label}</span>
    </div>
  );
}
