import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import AccessibilityMenu from "./components/AccessibilityMenu";

// ── Lazy-load all pages (code splitting per route) ──────────────────────────
// Each page is only downloaded when the user navigates to it
const Home           = lazy(() => import("./pages/Home"));
const Login          = lazy(() => import("./pages/Login"));
const AdminLogin     = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const PharmacistDashboard = lazy(() => import("./pages/PharmacistDashboard"));

// ── Page transition variants ────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

// ── Loading fallback: minimal skeleton so the page doesn't flash white ──────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col">
      {/* Fake navbar */}
      <div className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-sm flex items-center px-8 gap-4">
        <div className="w-32 h-6 skeleton rounded-full" />
        <div className="flex-1" />
        <div className="w-24 h-8 skeleton rounded-xl" />
        <div className="w-24 h-8 skeleton rounded-xl" />
      </div>
      {/* Fake hero */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        <div className="w-3/4 max-w-md h-8 skeleton rounded-2xl" />
        <div className="w-1/2 max-w-xs h-5 skeleton rounded-2xl" />
        <div className="w-full max-w-2xl h-16 skeleton rounded-2xl" />
      </div>
    </div>
  );
}

// ── Animated routes wrapper ─────────────────────────────────────────────────
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ minHeight: "100vh" }}
      >
        <Routes location={location}>
          <Route path="/"               element={<Home />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/admin/login"    element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/pharmacist/dashboard" element={<PharmacistDashboard />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageSkeleton />}>
            <AnimatedRoutes />
          </Suspense>
          <AccessibilityMenu />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
