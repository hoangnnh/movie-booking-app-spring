import SeatButton from "./SeatButton";
import { cn } from "../../utils/cn";

export default function SeatMap({
  seats = [],
  selectedSeatIds = [],
  onToggleSeat,
  columns = 8,
  size = "md",
  className = "",
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-[32px] flex justify-center">
        <div className="w-[70%] rounded-full border-t border-primary-600 pt-[12px] text-center type-label-s text-app-text-muted">
          SCREEN
        </div>
      </div>

      <div
        className="mx-auto grid w-fit gap-[12px]"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, auto))`,
        }}
      >
        {seats.map((seat) => {
          const seatId = seat.seatId || seat.id;
          const isSelected = selectedSeatIds.includes(seatId);

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
              onClick={() => onToggleSeat?.(seat)}
            />
          );
        })}
      </div>

      <div className="mt-[32px] flex justify-center gap-[24px]">
        <LegendItem status="available" label="Available" />
        <LegendItem status="selected" label="Selected" />
        <LegendItem status="booked" label="Booked" />
      </div>
    </div>
  );
}

function LegendItem({ status, label }) {
  return (
    <div className="flex items-center gap-[8px]">
      <SeatButton label="" status={status} size="sm" />
      <span className="type-body-xs text-app-text-muted">{label}</span>
    </div>
  );
}