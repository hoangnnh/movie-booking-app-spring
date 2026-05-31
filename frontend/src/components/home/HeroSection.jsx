import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Button from "../common/Button";
import { heroImage } from "./homeData";

const heroStats = [
  {
    value: "500+",
    label: "Movies Available",
  },
  {
    value: "150+",
    label: "Cinema Locations",
  },
  {
    value: "1M+",
    label: "Happy Customers",
  },
];

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[640px] overflow-hidden bg-[#06070b] text-white sm:min-h-[720px]">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Cinema hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(245,248,250,0.42)_0%,rgba(12,15,18,0.18)_30%,rgba(4,5,8,0.82)_82%,#05060a_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.16),rgba(0,0,0,0)_32%),linear-gradient(90deg,rgba(0,0,0,0.42),rgba(0,0,0,0.12)_38%,rgba(0,0,0,0.5))]" />
      </div>

      <div className="ticketor-container relative z-10 flex min-h-[640px] flex-col justify-end pb-0 pt-[96px] sm:min-h-[720px] sm:pt-[116px]">
        <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col items-center justify-center px-[8px] text-center">
          <h1 className="max-w-[720px] text-balance text-[42px] font-extrabold uppercase leading-[1.12] text-white sm:text-[58px] lg:text-[66px]">
            Book Your Movie Tickets Now!
          </h1>

          <p className="mt-[24px] max-w-[440px] text-[14px] font-bold leading-[1.35] text-white/90 sm:text-[16px]">
            Watch The Latest Movies At Your Favorite Cinemas
          </p>

          <div className="mt-[40px] flex w-full max-w-[360px] flex-col items-center justify-center gap-[14px] sm:flex-row">
            <Button
              size={40}
              variant="primary"
              className="w-full rounded-tk-4 px-[18px] sm:w-auto"
              rightIcon={<ArrowRight />}
              onClick={() => navigate("/movies/showing-now")}
            >
              Explore Movies
            </Button>

            <Button
              size={40}
              variant="text"
              tone="base"
              className="w-full text-white hover:text-brand sm:w-auto"
            >
              Find Cinema
            </Button>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[780px] grid-cols-1 gap-[24px] pb-[64px] text-center sm:grid-cols-3 sm:gap-[32px]">
          {heroStats.map((stat) => (
            <div key={stat.label}>
              <p className="text-[34px] font-extrabold leading-none text-white sm:text-[38px]">
                {stat.value}
              </p>
              <p className="mt-[12px] text-[14px] text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 bg-[#101115]/95 px-[16px] py-[22px] text-center shadow-[0_-16px_40px_rgba(0,0,0,0.25)]">
        <p className="text-[13px] font-bold text-white/90 sm:text-[14px]">
          Special Offer: Buy 2 Tickets, Get 1 FREE! Valid This Weekend Only.{" "}
          <button className="font-bold text-white underline decoration-white/70 underline-offset-4">
            Learn More
          </button>
        </p>
      </div>
    </section>
  );
}
