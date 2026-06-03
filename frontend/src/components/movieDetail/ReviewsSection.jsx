import { useState } from "react";
import ScoreBadge from "../movie/ScoreBadge";
import SectionHeader from "../home/SectionHeader";
import { cn } from "../../utils/cn";
import { movieApi } from "../../api/api";

const tabs = ["All reviews", "Positive reviews", "Average reviews", "Negative reviews"];

export default function ReviewsSection({
  movieId,
  score = "7.5",
  reviewsData,
  user,
  onRequireAuth,
  onReviewSaved,
}) {
  const [activeTab, setActiveTab] = useState("All reviews");
  const [draft, setDraft] = useState({ score: 8, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const reviews = reviewsData?.reviews || [];
  const summary = reviewsData?.summary || {
    totalReviews: 0,
    averageScore: Number(score) || 0,
    positiveReviews: 0,
    averageReviews: 0,
    negativeReviews: 0,
  };
  const currentUserReview = reviews.find((review) => review.currentUserReview);
  const displayScore = summary.totalReviews > 0
    ? Number(summary.averageScore).toFixed(1)
    : Number(score || 0).toFixed(1);
  const filteredReviews = reviews.filter((review) => {
    const reviewScore = Number(review.score);

    if (activeTab === "Positive reviews") return reviewScore >= 8;
    if (activeTab === "Average reviews") return reviewScore >= 5 && reviewScore < 8;
    if (activeTab === "Negative reviews") return reviewScore < 5;

    return true;
  });

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) {
      onRequireAuth?.();
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const savedReview = await movieApi.saveReview(movieId, {
        score: Number(draft.score),
        title: draft.title,
        body: draft.body,
      });

      setDraft({ score: 8, title: "", body: "" });
      setMessage(currentUserReview ? "Review updated." : "Review posted.");
      onReviewSaved?.(savedReview);
    } catch (error) {
      setMessage(error.message || "Cannot save review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ticketor-container py-[56px]">
      <SectionHeader title="User Reviews" actionText={`${summary.totalReviews} total`} />

      <div className="grid gap-[24px] lg:grid-cols-12">
        <aside className="rounded-card border border-app-border bg-app-background p-[24px] lg:col-span-4">
          <div className="flex items-center gap-[20px]">
            <ScoreBadge value={displayScore} tone="brand" size="lg" />

            <div>
              <p className="type-body-s text-app-text-muted">User Score</p>
              <h3 className="type-h5 text-app-text">{getScoreLabel(displayScore)}</h3>
            </div>
          </div>

          <div className="mt-[32px] space-y-[16px]">
            <ScoreBar
              label="Positive"
              value={getPercent(summary.positiveReviews, summary.totalReviews)}
              color="bg-secondary-700"
            />
            <ScoreBar
              label="Average"
              value={getPercent(summary.averageReviews, summary.totalReviews)}
              color="bg-primary-600"
            />
            <ScoreBar
              label="Negative"
              value={getPercent(summary.negativeReviews, summary.totalReviews)}
              color="bg-error-500"
            />
          </div>

          <form className="mt-[32px] border-t border-app-border pt-[24px]" onSubmit={handleSubmit}>
            <div className="mb-[16px]">
              <p className="type-body-s font-bold text-app-text">
                {currentUserReview ? "Update your review" : "Write a review"}
              </p>
              {currentUserReview && (
                <p className="mt-[4px] type-body-xs text-app-text-muted">
                  Your current score is {currentUserReview.score}/10.
                </p>
              )}
            </div>

            <label className="block">
              <span className="type-label-s text-app-text-muted">Score</span>
              <input
                type="number"
                min="1"
                max="10"
                value={draft.score}
                onChange={(event) => setDraft((value) => ({ ...value, score: event.target.value }))}
                className="mt-[6px] w-full rounded-tk-4 border border-app-border bg-app-surface px-[12px] py-[10px] type-body-s text-app-text outline-none focus:border-primary-600"
              />
            </label>

            <label className="mt-[12px] block">
              <span className="type-label-s text-app-text-muted">Title</span>
              <input
                value={draft.title}
                maxLength={120}
                onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))}
                className="mt-[6px] w-full rounded-tk-4 border border-app-border bg-app-surface px-[12px] py-[10px] type-body-s text-app-text outline-none focus:border-primary-600"
                placeholder="Quick verdict"
              />
            </label>

            <label className="mt-[12px] block">
              <span className="type-label-s text-app-text-muted">Review</span>
              <textarea
                value={draft.body}
                maxLength={2000}
                rows={4}
                onChange={(event) => setDraft((value) => ({ ...value, body: event.target.value }))}
                className="mt-[6px] w-full resize-none rounded-tk-4 border border-app-border bg-app-surface px-[12px] py-[10px] type-body-s text-app-text outline-none focus:border-primary-600"
                placeholder="Share what worked or did not work."
              />
            </label>

            {message && (
              <p className="mt-[12px] type-body-xs text-app-text-muted">{message}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-[16px] w-full rounded-button bg-primary-600 px-[16px] py-[10px] type-button-m text-neutral-900 transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : user ? "Submit Review" : "Sign in to Review"}
            </button>
          </form>
        </aside>

        <div className="lg:col-span-8">
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

          <div className="grid gap-[16px] xl:grid-cols-2">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))
            ) : (
              <div className="rounded-card border border-app-border bg-app-background p-[20px] xl:col-span-2">
                <p className="type-body-s text-app-text-muted">
                  No reviews in this category yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function getPercent(count, total) {
  if (!total) {
    return "0%";
  }

  return `${Math.round((count / total) * 100)}%`;
}

function getScoreLabel(value) {
  const score = Number(value);

  if (score >= 8) return "Highly Favorable";
  if (score >= 5) return "Generally Favorable";
  if (score > 0) return "Mixed Reviews";

  return "No User Reviews";
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

          <div>
            <h3 className="type-body-s font-bold text-app-text">{review.reviewerName}</h3>
            <p className="type-body-xs text-app-text-muted">{review.title}</p>
          </div>
        </div>

        <p className="type-body-xs text-app-text-muted">{formatReviewDate(review.createdAt)}</p>
      </div>

      <p className="type-body-xs min-h-[96px] text-app-text-muted">
        {review.body}
      </p>

      {review.currentUserReview && (
        <p className="type-body-xs mt-[16px] text-brand">Your review</p>
      )}
    </article>
  );
}

function formatReviewDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
