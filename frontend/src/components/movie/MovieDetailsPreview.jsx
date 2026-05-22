import ReviewerProfile from "./ReviewerProfile";
import ReviewCard from "./ReviewCard";
import ScoreBadge from "./ScoreBadge";
import UserScoreSummary from "./UserScoreSummary";

const avatar =
    "https://images.unsplash.com/photo-1615109398623-88346a601842?q=80&w=800&auto=format&fit=crop";

export default function MovieDetailsPreview() {
    return (
        <section className="bg-app-background py-[80px] text-app-text">
            <div className="ticketor-container">
                <div className="grid grid-cols-12 gap-[16px]">
                    <div className="col-span-3">
                        <ReviewerProfile
                            avatarUrl={avatar}
                            name="Name"
                            role="Role"
                        />
                    </div>

                    <div className="col-span-6 flex flex-col gap-[40px]">
                        <ReviewCard
                            score="9"
                            name="Name"
                            date="jun 25, 2025"
                            onFullReview={() => alert("Full Review")}
                        />

                        <UserScoreSummary
                            score="7.5"
                            label="User Score"
                            description="Generally Favorable"
                        />
                    </div>

                    <div className="col-span-1 flex flex-col gap-[16px]">
                        <ScoreBadge value="9" tone="info" />
                        <ScoreBadge value="9" tone="brand" />
                        <ScoreBadge value="9" tone="error" />
                    </div>

                    <div className="col-span-2">
                        <div className="rounded-tk-8 border border-dashed border-purple-500 p-[20px]">
                            <h3 className="type-h6 border-b border-primary-600 pb-[12px] text-app-text">
                                Reviews
                            </h3>

                            <p className="type-body-s mt-[20px] text-app-text-muted">
                                Reviews
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}