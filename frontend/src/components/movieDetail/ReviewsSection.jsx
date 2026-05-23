import { useState } from "react";
import ScoreBadge from "../movie/ScoreBadge";
import SectionHeader from "../home/SectionHeader";
import { cn } from "../../utils/cn";
import { fallbackReviews } from "./movieDetailData";

const tabs = ["All reviews", "Positive reviews", "Average reviews", "Negative reviews"];

export default function ReviewsSection({ score = "7.5", reviews = fallbackReviews }) {
  const [activeTab, setActiveTab] = useState("All reviews");

  return (
    <section className="ticketor-container py-[56px]">
      <SectionHeader title="User Reviews" actionText="View All" />

      <div className="grid grid-cols-12 gap-[24px]">
        <aside className="col-span-4 rounded-card border border-app-border bg-app-background p-[24px]">
          <div className="flex items-center gap-[20px]">
            <ScoreBadge value={score} tone="brand" size="lg" />

            <div>
              <p className="type-body-s text-app-text-muted">User Score</p>
              <h3 className="type-h5 text-app-text">Generally Favorable</h3>
            </div>
          </div>

          <div className="mt-[32px] space-y-[16px]">
            <ScoreBar label="Positive" value="73%" color="bg-secondary-700" />
            <ScoreBar label="Average" value="15%" color="bg-primary-600" />
            <ScoreBar label="Negative" value="7%" color="bg-error-500" />
          </div>
        </aside>

        <div className="col-span-8">
          <div className="mb-[24px] flex flex-wrap gap-[8px]">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-tk-4 border px-[14px] py-[8px] type-body-xs transition-colors",
                  activeTab === tab
                    ? "border-primary-600 bg-primary-600 text-neutral-900"
                    : "border-app-border text-app-text-muted hover:border-primary-600 hover:text-primary-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-[16px]">
            {reviews.map((review) => (
              <ReviewItem key={`${review.name}-${review.date}`} review={review} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div>
      <div className="mb-[6px] flex items-center justify-between">
        <span className="type-body-xs text-app-text-muted">{label}</span>
        <span className="type-body-xs text-app-text-muted">{value}</span>
      </div>

      <div className="h-[4px] overflow-hidden rounded-full bg-app-surface">
        <div className={cn("h-full rounded-full", color)} style={{ width: value }} />
      </div>
    </div>
  );
}

function ReviewItem({ review }) {
  return (
    <article className="rounded-card border border-app-border bg-app-background p-[20px]">
      <div className="mb-[16px] flex items-center justify-between gap-[12px]">
        <div className="flex items-center gap-[12px]">
          <ScoreBadge
            value={review.score}
            tone={Number(review.score) < 6 ? "error" : "info"}
            size="sm"
          />

          <h3 className="type-body-s font-bold text-app-text">{review.name}</h3>
        </div>

        <p className="type-body-xs text-app-text-muted">{review.date}</p>
      </div>

      <p className="type-body-xs min-h-[96px] text-app-text-muted">
        {review.text}
      </p>

      <button className="type-body-xs mt-[16px] text-brand hover:text-brand-hover">
        Full Review
      </button>
    </article>
  );
}