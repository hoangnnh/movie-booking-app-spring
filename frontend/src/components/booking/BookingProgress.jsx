import { cn } from "../../utils/cn";

const defaultSteps = ["Seat", "Food & Drink", "Payment", "Ticket"];

export default function BookingProgress({
  steps = defaultSteps,
  currentStep = 0,
  className = "",
}) {
  return (
    <div className={cn("w-full overflow-x-auto pb-[4px]", className)}>
      <div className="relative flex min-w-[540px] items-center justify-between gap-[20px]">
        <div className="absolute left-0 right-0 top-[30px] h-px bg-app-border" />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div
              key={step}
              className="relative z-10 flex min-w-[120px] flex-col items-center gap-[12px] sm:gap-[16px]"
            >
              <p
                className={cn(
                  "type-body-s sm:type-body-l",
                  isActive || isCompleted
                    ? "text-app-text"
                    : "text-app-text-muted"
                )}
              >
                {step}
              </p>

              <span
                className={cn(
                  "h-[20px] w-[20px] rounded-full border transition-colors",
                  isCompleted && "border-brand bg-brand",
                  isActive && "border-primary-600 bg-primary-600",
                  !isCompleted &&
                  !isActive &&
                  "border-app-border bg-app-surface"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
