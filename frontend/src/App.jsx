import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import AuthModal from "./components/auth/AuthModal";
import AdminRoute from "./components/auth/AdminRoute";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import MovieAdvisorChat from "./components/ai/MovieAdvisorChat";
import { useAuth } from "./context/useAuth";
import { useTheme } from "./context/useTheme";
import HomePage from "./pages/HomePage";
import FoodDrinkPage from "./pages/FoodDrinkPage";
import MoviesPage from "./pages/MoviesPage";
import CinemasPage from "./pages/CinemasPage";
import ActorMoviesPage from "./pages/ActorMoviesPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import MyBookingPage from "./pages/MyBookingPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { ContactPage, PrivacyPolicyPage, TermsOfUsePage } from "./pages/InfoPages";
import SeatSelectionPage from "./pages/SeatSelectionPage";
import PaymentPage from "./pages/PaymentPage";
import ProfilePage from "./pages/ProfilePage";
import TmdbImportPage from "./pages/TmdbImportPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  const location = useLocation();
  const { ready, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [authMode, setAuthMode] = useState(null);
  const isHome = location.pathname === "/";
  const isAdminPage = location.pathname.startsWith("/admin") || location.pathname === "/tmdb";
  const hideFooter = /^\/booking\/[^/]+\/(seats|food|payment)$/.test(location.pathname)
    || location.pathname.startsWith("/admin")
    || location.pathname === "/tmdb"
    || location.pathname === "/oauth/callback"
    || location.pathname === "/reset-password";

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
        variant={isHome ? "overlay" : "solid"}
        showSearch={isAdminPage}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/movies/showing-now"
          element={<MoviesPage key={`movies:${location.search}`} statusFilter="released" />}
        />
        <Route path="/movies/coming-soon" element={<MoviesPage statusFilter="coming-soon" />} />
        <Route path="/movies" element={<Navigate to="/movies/showing-now" replace />} />
        <Route path="/coming-soon" element={<Navigate to="/movies/coming-soon" replace />} />
        <Route path="/cinemas" element={<CinemasPage />} />
        <Route
          path="/movies/:movieRef"
          element={<MovieDetailPage />}
        />
        <Route path="/booking/:movieRef" element={<MovieDetailPage />} />
        <Route
          path="/my-booking"
          element={<MyBookingPage onRequireAuth={() => setAuthMode("login")} />}
        />
        <Route
          path="/my-booking/:bookingId"
          element={<MyBookingPage onRequireAuth={() => setAuthMode("login")} />}
        />
        <Route
          path="/profile"
          element={<ProfilePage onRequireAuth={() => setAuthMode("login")} />}
        />
        <Route path="/actors/:actorName/movies" element={<ActorMoviesPage />} />
        <Route path="/tmdb" element={<AdminRoute><TmdbImportPage /></AdminRoute>} />
        <Route
          path="/admin"
          element={<AdminDashboardPage onRequireAuth={() => setAuthMode("login")} />}
        />
        <Route path="/admin/movies" element={<AdminRoute><TmdbImportPage /></AdminRoute>} />
        <Route path="/admin/imports" element={<AdminRoute><TmdbImportPage /></AdminRoute>} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsOfUsePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/booking/:showtimeId/seats" element={<SeatSelectionPage />} />
        <Route
          path="/booking/:showtimeId/food"
          element={<FoodDrinkPage onRequireAuth={() => setAuthMode("login")} />}
        />
        <Route
          path="/booking/:showtimeId/payment"
          element={<PaymentPage onRequireAuth={() => setAuthMode("login")} />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {!hideFooter && <Footer variant="plain" />}

      {!isAdminPage && <MovieAdvisorChat />}

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
