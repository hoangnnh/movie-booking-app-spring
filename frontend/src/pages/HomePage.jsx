import { useEffect, useMemo, useState } from "react";
import { movieApi } from "../api/api";

import HeroSection from "../components/home/HeroSection";
import StatsSection from "../components/home/StatsSection";
import SpecialOfferBanner from "../components/home/SpecialOfferBanner";
import MovieSection from "../components/home/MovieSection";
import EventsOffersSection from "../components/home/EventsOffersSection";
import BookingCTASection from "../components/home/BookingCTASection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import FAQSection from "../components/home/FAQSection";
import NewsletterSection from "../components/home/NewsletterSection";
import { isComingSoon } from "../components/home/homeUtils";

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMovies() {
      try {
        setLoading(true);
        const data = await movieApi.getAll();
        setMovies(data);
      } catch {
        setError("Cannot load movies from server.");
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, []);

  const releasedMovies = useMemo(
    () => movies.filter((movie) => !isComingSoon(movie)),
    [movies]
  );

  const comingSoonMovies = useMemo(() => {
    const result = movies.filter(isComingSoon);

    return result.length > 0 ? result : movies;
  }, [movies]);

  return (
    <div className="bg-app-background text-app-text">
      <HeroSection />
      <StatsSection />
      <SpecialOfferBanner />

      {loading && (
        <div className="ticketor-container py-[56px]">
          <p className="type-body-m text-app-text-muted">Loading movies...</p>
        </div>
      )}

      {error && (
        <div className="ticketor-container py-[32px]">
          <div className="rounded-tk-8 border border-error-500 bg-app-background p-[16px] text-error-500">
            {error}
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <MovieSection
            title="Currently In Cinemas"
            description="Discover the latest movies now playing in cinemas. Book your tickets today!"
            movies={releasedMovies}
            status="released"
            limit={5}
          />

          <MovieSection
            title="Top 10 Movies This Week"
            description="Hot this week: top movies and where to watch them."
            movies={releasedMovies}
            status="released"
            limit={10}
          />

          <EventsOffersSection />

          <MovieSection
            title="Coming Soon"
            description="Get ready for these upcoming releases."
            movies={comingSoonMovies}
            status="coming-soon"
            limit={10}
          />
        </>
      )}

      <BookingCTASection />
      <TestimonialsSection />
      <FAQSection />
      <NewsletterSection />
    </div>
  );
}
