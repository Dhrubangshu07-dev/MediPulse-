import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, Sparkles, Video, X } from "lucide-react";
import { Activity, BadgeCheck, Heart, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * Hero — emits search via URL params so Home.jsx can react.
 * Pattern: navigate("/?q=cardiologist&city=mumbai&type=video")
 * Home reads useSearchParams() and filters the doctor grid accordingly.
 */
export default function Hero() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [query, setQuery]       = useState("");
  const [location, setLocation] = useState("");
  const [consultType, setType]  = useState("All");

  const STATS = [
    { value: "500+", label: t("hero.stats.verifiedDoctors", "Verified Doctors"),  Icon: BadgeCheck },
    { value: "50K+", label: t("hero.stats.happyPatients", "Happy Patients"),    Icon: Heart      },
    { value: "4.9★", label: t("hero.stats.averageRating", "Average Rating"),    Icon: Star       },
    { value: "24/7", label: t("hero.stats.supportAvailable", "Support Available"), Icon: Activity   },
  ];

  const QUICK_SEARCHES = [
    { term: "Cardiologist", label: t("specialties.Cardiology", "Cardiology") },
    { term: "Dermatologist", label: t("specialties.Dermatology", "Dermatology") },
    { term: "Neurologist", label: t("specialties.Neurology", "Neurology") },
    { term: "Pediatrician", label: t("specialties.Pediatrics", "Pediatrics") },
  ];

  const doSearch = useCallback((overrideQuery) => {
    const q = overrideQuery ?? query;
    // Build search params
    const params = new URLSearchParams();
    if (q.trim())         params.set("q",    q.trim());
    if (location.trim())  params.set("city", location.trim());
    if (consultType !== "All") params.set("type", consultType);

    // Navigate with params — Home.jsx picks them up and filters the list
    navigate(`/?${params.toString()}`, { replace: true });

    // Smooth-scroll down to the doctors section
    setTimeout(() => {
      document.getElementById("doctors-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
  }, [query, location, consultType, navigate]);

  const handleQuick = useCallback((term) => {
    setQuery(term);
    doSearch(term);
  }, [doSearch]);

  const clearQuery = () => {
    setQuery("");
    navigate("/", { replace: true });
  };

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_#064e3b_0%,_#065f46_30%,_#047857_60%,_#059669_100%)]">

      {/* Layered gradient mesh blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] bg-green-300/15 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px]" />
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/25 rounded-full px-5 py-2 mb-8 shadow-inner">
            <Sparkles size={14} className="text-green-300 animate-pulse" />
            <span className="text-sm font-semibold text-white/90 tracking-wide">
              {t("hero.badge", "AI-Powered Healthcare Platform")}
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
            {t("hero.titlePart1", "Find & Book the")}{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-green-300 via-emerald-200 to-teal-300 bg-clip-text text-transparent">
                {t("hero.titleHighlight", "Best Doctors")}
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 320 10" fill="none" aria-hidden="true">
                <path d="M2 7 Q80 1 160 7 Q240 13 318 7" stroke="url(#underline-grad)" strokeWidth="2.5" strokeLinecap="round" />
                <defs>
                  <linearGradient id="underline-grad" x1="0" y1="0" x2="320" y2="0">
                    <stop stopColor="#6EE7B7" />
                    <stop offset="1" stopColor="#5EEAD4" />
                  </linearGradient>
                </defs>
              </svg>
            </span>{" "}
            {t("hero.titlePart2", "Near You")}
          </motion.h1>

          <motion.p variants={fadeUp} className="text-base sm:text-lg text-green-100/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t("hero.subtitle", "Connecting patients with trusted healthcare professionals. Book same-day appointments, consult online, and manage your health — all in one beautiful place.")}
          </motion.p>

          {/* ── Search Bar — Glassmorphic ── */}
          <motion.div
            variants={fadeUp}
            className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-3 max-w-3xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-2">

              {/* Doctor / specialty search */}
              <label className="flex-1 flex items-center gap-2 px-4 py-3.5 bg-white/85 backdrop-blur-sm rounded-2xl focus-within:ring-2 focus-within:ring-green-400/50 focus-within:bg-white transition-all cursor-text shadow-sm">
                <Search size={16} className="text-green-600 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()}
                  placeholder={t("hero.searchPlaceholder", "Doctor name or specialty…")}
                  aria-label="Search doctor or specialty"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none font-medium min-w-0"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearQuery}
                    className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>

              {/* City / hospital */}
              <label className="flex-1 flex items-center gap-2 px-4 py-3.5 bg-white/85 backdrop-blur-sm rounded-2xl focus-within:ring-2 focus-within:ring-emerald-400/50 focus-within:bg-white transition-all cursor-text shadow-sm">
                <MapPin size={16} className="text-emerald-600 shrink-0" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()}
                  placeholder={t("hero.cityPlaceholder", "City or hospital…")}
                  aria-label="Search location"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none font-medium min-w-0"
                />
              </label>

              {/* Consult type selector */}
              <div className="flex items-center gap-2 px-4 py-3.5 bg-white/85 backdrop-blur-sm rounded-2xl sm:w-44 shadow-sm border-0">
                <Video size={16} className="text-teal-500 shrink-0" />
                <select
                  value={consultType}
                  onChange={(e) => setType(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-600 outline-none cursor-pointer font-medium"
                  aria-label="Consultation type"
                >
                  <option value="All">{t("hero.allTypes", "All Types")}</option>
                  <option value="In-Clinic">{t("hero.inClinic", "In-Clinic")}</option>
                  <option value="Video">{t("hero.video", "Video")}</option>
                </select>
              </div>

              {/* Search CTA */}
              <motion.button
                type="button"
                onClick={() => doSearch()}
                whileHover={{ scale: 1.03, boxShadow: "0 8px 25px rgba(16,185,129,0.45)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white text-sm font-bold px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-green-900/30 whitespace-nowrap"
              >
                <Search size={16} />
                {t("hero.searchBtn", "Search")}
              </motion.button>
            </div>

            {/* Quick Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-3 px-1 pb-1">
              <span className="text-xs text-white/50 font-medium">{t("hero.quick", "Quick:")}</span>
              {QUICK_SEARCHES.map(({ term, label }) => (
                <motion.button
                  key={term}
                  type="button"
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleQuick(term)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                    query === term
                      ? "bg-white/30 border-white/50 text-white"
                      : "text-green-200 bg-white/10 hover:bg-white/20 border-white/20"
                  }`}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Stats Strip ── */}
        <motion.div
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {STATS.map(({ value, label, Icon }, i) => (
            <motion.div
              key={label}
              variants={fadeUp}
              transition={{ delay: 0.5 + i * 0.08 }}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center cursor-default shadow-inner transition-colors"
            >
              <Icon size={22} className="text-green-300 mx-auto mb-2" />
              <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
              <div className="text-xs text-green-100/70 mt-1 font-medium">{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
