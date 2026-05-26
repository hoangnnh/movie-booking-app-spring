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
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [topMoviesThisWeek, setTopMoviesThisWeek] = useState([]);
  const [catalogMovies, setCatalogMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHomeMovies() {
      try {
        setLoading(true);
        setError("");

        const [nowPlaying, trendingThisWeek, catalog] = await Promise.all([
          movieApi.getNowPlaying(10),
          movieApi.getTrendingThisWeek(10),
          movieApi.getAll(),
        ]);

        setNowPlayingMovies(Array.isArray(nowPlaying) ? nowPlaying : []);
        setTopMoviesThisWeek(
          Array.isArray(trendingThisWeek) ? trendingThisWeek : []
        );
        setCatalogMovies(Array.isArray(catalog) ? catalog : []);
      } catch {
        setError("Cannot load TMDB movie sections from server.");
      } finally {
        setLoading(false);
      }
    }

    loadHomeMovies();
  }, []);

  const comingSoonMovies = useMemo(() => {
    const result = catalogMovies.filter(isComingSoon);

    return result.length > 0 ? result : catalogMovies;
  }, [catalogMovies]);

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
            movies={nowPlayingMovies}
            status="released"
            limit={5}
          />

          <MovieSection
            title="Top 10 Movies This Week"
            description="Trending on TMDB this week, refreshed from the TMDB API."
            movies={topMoviesThisWeek}
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
