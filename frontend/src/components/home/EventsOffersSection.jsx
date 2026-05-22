import PromotionCard from "../movie/PromotionCard";
import { promoImages } from "./homeData";

export default function EventsOffersSection() {
  return (
    <section className="ticketor-container py-[56px]">
      <div className="mb-[32px] text-center">
        <h2 className="type-h2 mx-auto max-w-[760px] text-app-text">
          Now Showing with Festivals, Screenings and Special Offers
        </h2>

        <p className="type-body-m mx-auto mt-[12px] max-w-[620px] text-app-text-muted">
          Unique film events and limited-time offers — do not miss what is
          coming next.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-[24px]">
        <PromotionCard
          imageUrl={promoImages.horror}
          badge="Special Event"
          title="Horror Film Festival"
          description="Spine chilling classics"
          onClick={() => alert("Promotion detail will be added later.")}
        />

        <PromotionCard
          imageUrl={promoImages.student}
          badge="Limit Time"
          title="Student Discount"
          description="50% off all weekday matinee show"
          onClick={() => alert("Promotion detail will be added later.")}
        />
      </div>
    </section>
  );
}