import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";

// ── Full-screen spinner shown while session is being resolved ─────────────────
function AuthLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-900/40 animate-pulse">
        <HeartPulse size={22} className="text-white" />
      </div>
      <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-slate-500 text-sm font-medium">Verifying session…</p>
    </div>
  );
}

/**
 * ProtectedRoute — gates a route behind authentication + optional role check.
 *
 * Props:
 *   children   — the page component to render
 *   role       — "admin" | "customer" | undefined (any authenticated user)
 *   redirectTo — where to send unauthenticated users (default "/login")
 */
export default function ProtectedRoute({ children, role, redirectTo = "/login" }) {
  const { user, loading, isAdmin, isCustomer } = useAuth();
  const location = useLocation();

  // Still resolving session — show spinner so we don't flash a redirect
  if (loading) return <AuthLoader />;

  // Not logged in at all
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Wrong role
  if (role === "admin" && !isAdmin) {
    // Customer trying to access admin → send them home
    return <Navigate to="/" replace />;
  }

  if (role === "customer" && !isCustomer) {
    // Admin trying to access customer profile → send them to dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
