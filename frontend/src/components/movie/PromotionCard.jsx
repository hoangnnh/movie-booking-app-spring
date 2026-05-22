import { ArrowRight } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/cn";

export default function PromotionCard({
  badge = "Limit Time",
  title = "Student Discount",
  description = "50% Off All Weekday Matinee Show",
  imageUrl = "",
  onClick,
  className = "",
}) {
  return (
    <article
      className={cn(
        "relative h-[190px] w-full overflow-hidden rounded-card bg-app-surface",
        className
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-700" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between p-[24px]">
        <span className="w-fit rounded-tk-4 bg-brand px-[12px] py-[4px] type-label-s text-neutral-900">
          {badge}
        </span>

        <div className="flex items-end justify-between gap-[24px]">
          <div>
            <h2 className="type-h3 max-w-[280px] text-app-text">{title}</h2>
            <p className="type-body-s mt-[8px] text-secondary-600">
              {description}
            </p>
          </div>

          <Button
            size={40}
            variant="primary"
            rightIcon={<ArrowRight />}
            onClick={onClick}
          >
            Learn More
          </Button>
        </div>
      </div>
    </article>
  );
}