import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { heroImage } from "./homeData";
import { useTheme } from "../../context/useTheme";

export default function HeroSection() {
  const navigate = useNavigate();
  const { isLightMode } = useTheme();

  return (
    <section className="ticketor-container pt-[24px] sm:pt-[32px]">
      <div className="relative min-h-[420px] overflow-hidden rounded-card sm:min-h-[520px]">
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

        <div className="relative z-10 flex min-h-[420px] flex-col items-center justify-center px-[20px] py-[48px] text-center sm:min-h-[520px] sm:px-[40px] lg:px-[64px]">
          <h1 className="type-display-1 max-w-[780px] text-balance uppercase text-app-text">
            Book Your Movie Tickets Now!
          </h1>

          <p className="type-body-xl mt-[16px] max-w-[560px] text-app-text-muted sm:mt-[24px]">
            Watch the latest movies at your favorite cinemas.
          </p>

          <div className="mt-[24px] flex w-full max-w-[420px] flex-col gap-[12px] sm:mt-[32px] sm:flex-row sm:items-center sm:justify-center">
            <Button size={40} variant="primary" className="w-full sm:w-auto" onClick={() => navigate("/movies")}>
              Explore Movies
            </Button>

            <Button size={40} variant="outline" tone="base" className="w-full sm:w-auto">
              Find Cinema
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
