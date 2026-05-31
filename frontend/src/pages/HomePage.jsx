import { useEffect, useState } from "react";
import { movieApi } from "../api/api";

import HeroSection from "../components/home/HeroSection";
import MovieSection from "../components/home/MovieSection";
import BookingCTASection from "../components/home/BookingCTASection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import FAQSection from "../components/home/FAQSection";
import NewsletterSection from "../components/home/NewsletterSection";

export default function HomePage() {
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHomeMovies() {
      try {
        setLoading(true);
        setError("");

        const [nowPlaying, comingSoon] = await Promise.all([
          movieApi.getNowPlaying(10),
          movieApi.getComingSoon(10),
        ]);

        setNowPlayingMovies(Array.isArray(nowPlaying) ? nowPlaying : []);
        setComingSoonMovies(Array.isArray(comingSoon) ? comingSoon : []);
      } catch {
        setError("Cannot load TMDB movie sections from server.");
      } finally {
        setLoading(false);
      }
    }

    loadHomeMovies();
  }, []);

  return (
    <div className="bg-app-background text-app-text">
      <HeroSection />

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
            title="Showing Now"
            description="Discover the latest movies now playing in cinemas. Book your tickets today!"
            movies={nowPlayingMovies}
            status="released"
            limit={10}
          />

          <MovieSection
            title="Coming Soon"
            description="Keep an eye on the next movies worth booking."
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
