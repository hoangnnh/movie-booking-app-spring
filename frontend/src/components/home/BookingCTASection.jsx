import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { promoImages } from "./homeData";

export default function BookingCTASection() {
  const navigate = useNavigate();

  return (
    <section className="ticketor-container py-[64px]">
      <div className="grid grid-cols-12 overflow-hidden rounded-card border border-app-border bg-app-surface">
        <div className="col-span-5 min-h-[320px]">
          <img
            src={promoImages.cta}
            alt="Book movie online"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="col-span-7 flex flex-col justify-center p-[48px]">
          <h2 className="type-h2 max-w-[540px] text-app-text">
            Book tickets to your favorite movies Online
          </h2>

          <p className="type-body-m mt-[20px] max-w-[520px] text-app-text-muted">
            Get a sneak peek at the most popular current movie trailers and be
            the first to know about the hottest upcoming releases.
          </p>

          <div className="mt-[32px] flex items-center gap-[16px]">
            <Button size={40} variant="primary" onClick={() => navigate("/movies")}>
              Book Movie Ticket
            </Button>

            <Button size={40} variant="outline" tone="base">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}