import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { heroImage } from "./homeData";
import { useTheme } from "../../context/useTheme";

export default function HeroSection() {
  const navigate = useNavigate();
  const { isLightMode } = useTheme();

  return (
    <section className="ticketor-container pt-[32px]">
      <div className="relative min-h-[520px] overflow-hidden rounded-card">
        <img
          src={heroImage}
          alt="Cinema hero"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div
          className={
            isLightMode
              ? "absolute inset-0 bg-gradient-to-r from-[rgba(244,241,232,0.97)] via-[rgba(244,241,232,0.9)] to-[rgba(244,241,232,0.62)]"
              : "absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/20"
          }
        />

        <div className="relative z-10 flex min-h-[520px] flex-col items-center justify-center px-[64px] text-center">
          <h1 className="type-display-1 max-w-[780px] uppercase text-app-text">
            Book Your Movie Tickets Now!
          </h1>

          <p className="type-body-xl mt-[24px] max-w-[560px] text-app-text-muted">
            Watch the latest movies at your favorite cinemas.
          </p>

          <div className="mt-[32px] flex items-center gap-[16px]">
            <Button size={40} variant="primary" onClick={() => navigate("/movies")}>
              Explore Movies
            </Button>

            <Button size={40} variant="outline" tone="base">
              Find Cinema
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
