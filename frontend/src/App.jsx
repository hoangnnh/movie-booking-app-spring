import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import AuthModal from "./components/auth/AuthModal";
import Navbar from "./components/layout/Navbar";
import { useAuth } from "./context/useAuth";
import HomePage from "./pages/HomePage";
import FoodDrinkPage from "./pages/FoodDrinkPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import SeatSelectionPage from "./pages/SeatSelectionPage";
import TimeSelectionPage from "./pages/TimeSelectionPage";
import TmdbImportPage from "./pages/TmdbImportPage";

export default function App() {
  const { user, logout } = useAuth();
  const [authMode, setAuthMode] = useState(null);

  return (
    <>
      <Navbar
        user={user}
        onLoginClick={() => setAuthMode("login")}
        onSignUpClick={() => setAuthMode("signup")}
        onLogout={logout}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<HomePage />} />
        <Route path="/movies/:movieId" element={<MovieDetailPage />} />
        <Route path="/tmdb" element={<TmdbImportPage />} />
        <Route path="/booking/:showtimeId" element={<TimeSelectionPage />} />
        <Route path="/booking/:showtimeId/seats" element={<SeatSelectionPage />} />
        <Route path="/booking/:showtimeId/food" element={<FoodDrinkPage />} />
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
