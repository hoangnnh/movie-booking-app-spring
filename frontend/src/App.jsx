import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";
import AuthModal from "./components/auth/AuthModal";
import Navbar from "./components/layout/Navbar";
import { useAuth } from "./context/useAuth";
import { useTheme } from "./context/useTheme";
import HomePage from "./pages/HomePage";
import FoodDrinkPage from "./pages/FoodDrinkPage";
import MoviesPage from "./pages/MoviesPage";
import ActorMoviesPage from "./pages/ActorMoviesPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { ContactPage, PrivacyPolicyPage, TermsOfUsePage } from "./pages/InfoPages";
import SeatSelectionPage from "./pages/SeatSelectionPage";
import TimeSelectionPage from "./pages/TimeSelectionPage";
import PaymentPage from "./pages/PaymentPage";
import TmdbImportPage from "./pages/TmdbImportPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

export default function App() {
  const location = useLocation();
  const { ready, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [authMode, setAuthMode] = useState(null);

  if (!ready) {
    return null;
  }

  return (
    <>
      <Navbar
        user={user}
        onLoginClick={() => setAuthMode("login")}
        onSignUpClick={() => setAuthMode("signup")}
        onLogout={logout}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/movies"
          element={<MoviesPage key={`movies:${location.search}`} />}
        />
        <Route
          path="/movies/:movieId"
          element={<MovieDetailPage onRequireAuth={() => setAuthMode("login")} />}
        />
        <Route
          path="/favorites"
          element={<FavoritesPage onRequireAuth={() => setAuthMode("login")} />}
        />
        <Route path="/actors/:actorName/movies" element={<ActorMoviesPage />} />
        <Route path="/tmdb" element={<TmdbImportPage />} />
        <Route
          path="/admin"
          element={<AdminDashboardPage onRequireAuth={() => setAuthMode("login")} />}
        />
        <Route path="/admin/movies" element={<TmdbImportPage />} />
        <Route path="/admin/imports" element={<TmdbImportPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsOfUsePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/booking/:showtimeId" element={<TimeSelectionPage />} />
        <Route path="/booking/:showtimeId/seats" element={<SeatSelectionPage />} />
        <Route
          path="/booking/:showtimeId/food"
          element={<FoodDrinkPage onRequireAuth={() => setAuthMode("login")} />}
        />
        <Route
          path="/booking/:showtimeId/payment"
          element={<PaymentPage onRequireAuth={() => setAuthMode("login")} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {authMode && (
        <AuthModal
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setAuthMode(null)}
        />
      )}
    </>
  );
}
