import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function AdminRoute({ children }) {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}
