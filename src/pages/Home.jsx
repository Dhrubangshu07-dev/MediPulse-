import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Filter, Stethoscope, X, AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { supabase } from "../lib/supabase";
import Navbar           from "../components/Navbar";
import Hero             from "../components/Hero";
import SpecialtiesStrip from "../components/SpecialtiesStrip";
import DoctorCard       from "../components/DoctorCard";
import BookingModal     from "../components/BookingModal";
import HowItWorks       from "../components/HowItWorks";
import AIFeatures       from "../components/AIFeatures";
import Footer           from "../components/Footer";
import { FILTER_OPTIONS } from "../constants/ui";

export default function Home() {
  const [doctors, setDoctors]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error,   setError]             = useState(null);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [activeFilter, setActiveFilter]  = useState("All");
  const { t } = useLanguage();

  // ── Read search params from Hero's search bar ────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q")    || "";
  const searchCity  = searchParams.get("city") || "";
  const searchType  = searchParams.get("type") || "";

  // ── Fetch all doctors once ────────────────────────────────────────────────
  // ── Fetch all doctors ────────────────────────────────────────────────────
  const fetchDoctors = useCallback(async () => {
    setError(null);
    try {
      const res  = await fetch("/api/doctors");
      const json = await res.json();
      if (json.success) setDoctors(json.data || []);
      else setError(json.error || "Unable to load doctors. Please try again.");
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
      setError("Unable to load doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();

    // Subscribe to realtime changes in DoctorProfile table
    const channel = supabase
      .channel("home:DoctorProfile")
      .on("postgres_changes", { event: "*", schema: "public", table: "DoctorProfile" }, () => {
        fetchDoctors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDoctors]);

  // ── Derived filtered list: applies BOTH specialty filter chip AND search params ──
  const visibleDoctors = useMemo(() => {
    let list = doctors;

    // 1. Specialty chip filter
    if (activeFilter !== "All") {
      list = list.filter((d) =>
        d.specialty?.toLowerCase().includes(activeFilter.toLowerCase())
      );
    }

    // 2. Search bar — free-text query on name, specialty, hospital
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.specialty?.toLowerCase().includes(q) ||
          d.hospital?.toLowerCase().includes(q)
      );
    }

    // 3. City filter
    if (searchCity) {
      const c = searchCity.toLowerCase();
      list = list.filter((d) => d.hospital?.toLowerCase().includes(c));
    }

    // 4. Consultation type filter
    if (searchType && searchType !== "All") {
      list = list.filter((d) =>
        (d.consultType || []).some(
          (t) => t.toLowerCase().includes(searchType.toLowerCase())
        )
      );
    }

    return list;
  }, [doctors, activeFilter, searchQuery, searchCity, searchType]);

  // ── Detect whether an active search is applied ───────────────────────────
  const hasActiveSearch = searchQuery || searchCity || searchType;

  const clearSearch = useCallback(() => {
    setSearchParams({});
    setActiveFilter("All");
  }, [setSearchParams]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <Navbar />
      <Hero />
      <SpecialtiesStrip />

      {/* ── Doctors Section ── */}
      <section
        id="doctors-section"
        className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden scroll-mt-20"
      >
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-100/40 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Section header */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full shadow-sm">
                {t("home.ourNetwork", "Our Network")}
              </span>
              <h2 className="text-4xl font-extrabold text-slate-900 mt-5 tracking-tight">
                {t("home.topDoctors", "Top-Rated Doctors")}
              </h2>
              <p className="text-slate-500 mt-2 text-base">
                {t("home.verifiedSpecialists", "Verified specialists. Real patient reviews.")}
              </p>

              {/* Active search summary */}
              <AnimatePresence>
                {hasActiveSearch && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 mt-3 flex-wrap"
                  >
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                        🔍 "{searchQuery}"
                      </span>
                    )}
                    {searchCity && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                        📍 {searchCity}
                      </span>
                    )}
                    {searchType && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                        📹 {searchType}
                      </span>
                    )}
                    <button
                      onClick={clearSearch}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-2.5 py-1 rounded-full transition-colors"
                    >
                      <X size={11} /> {t("common.clearFilters", "Clear")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Specialty filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={15} className="text-slate-400 shrink-0" />
              {FILTER_OPTIONS.map((f) => {
                const label = f === "All" ? t("common.all", "All") : t(`specialties.${f}`, f);
                return (
                  <motion.button
                    key={f}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setActiveFilter(f)}
                    className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
                      activeFilter === f
                        ? "bg-gradient-to-r from-green-600 to-emerald-500 border-transparent text-white shadow-md shadow-green-200"
                        : "border-slate-200 bg-white/80 backdrop-blur-sm text-slate-600 hover:border-green-300 hover:bg-green-50"
                    }`}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Doctor Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton bg-white rounded-3xl h-80 border border-slate-100" />
              ))}
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <AlertCircle size={48} className="mx-auto mb-4 text-red-400 opacity-60" />
              <p className="font-bold text-lg text-slate-600 mb-1">{t("errors.loadDoctors")}</p>
              <button
                onClick={fetchDoctors}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-green-600 border border-green-200 bg-green-50 hover:bg-green-100 px-5 py-2.5 rounded-xl transition-colors"
              >
                {t("common.retry")}
              </button>
            </motion.div>
          ) : visibleDoctors.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeFilter}-${searchQuery}-${searchCity}-${searchType}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {visibleDoctors.map((doc) => (
                  <DoctorCard key={doc.id} doctor={doc} onBook={setBookingDoctor} />
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 text-slate-400"
            >
              <Stethoscope size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold text-lg text-slate-600 mb-1">{t("home.noResults", "No results found")}</p>
              <p className="text-sm text-slate-400 mb-5">
                {t("home.noResultsDesc", "Try a different specialty, city, or clear the search filters.")}
              </p>
              <button
                onClick={clearSearch}
                className="inline-flex items-center gap-2 text-sm font-bold text-green-600 border border-green-200 bg-green-50 hover:bg-green-100 px-5 py-2.5 rounded-xl transition-colors"
              >
                <X size={14} /> {t("home.clearSearch", "Clear all filters")}
              </button>
            </motion.div>
          )}

          {/* View All CTA */}
          {!hasActiveSearch && doctors.length > 0 && (
            <div className="text-center mt-14">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 8px 20px rgba(16,185,129,0.2)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 text-sm font-bold text-green-700 border border-green-200 bg-white/80 backdrop-blur-sm hover:bg-green-50 px-8 py-3.5 rounded-2xl transition-all shadow-sm"
              >
                {t("home.viewAll", "View All Doctors")} ({doctors.length}) <ArrowRight size={16} />
              </motion.button>
            </div>
          )}
        </div>
      </section>

      <HowItWorks />
      <AIFeatures />
      <Footer />

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingDoctor && (
          <BookingModal
            doctor={bookingDoctor}
            onClose={() => setBookingDoctor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
