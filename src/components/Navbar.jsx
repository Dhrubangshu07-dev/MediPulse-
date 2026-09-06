import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, HeartPulse, Menu, X, LogOut, LayoutDashboard, Globe } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import AccessibilityMenu, { LanguageToggleTab } from "./AccessibilityMenu";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isLoggedIn, isAdmin, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const NAV_LINKS = [
    { label: t("nav.home"),        href: "/" },
    { label: t("nav.findDoctor"),  href: "/#doctors-section" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleDashboard = () => {
    if (isAdmin) navigate("/admin/dashboard");
    else navigate("/patient/dashboard");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50"
    >
      {/* ── Outer wrapper — switches between transparent + glass pill ── */}
      <div
        className={`transition-all duration-500 ease-in-out ${
          scrolled
            ? "mx-4 mt-3"   // floating pill when scrolled
            : "mx-0 mt-0"   // full-width bar at top
        }`}
      >
        <nav
          className={`transition-all duration-500 ease-in-out ${
            scrolled
              ? "bg-white/75 backdrop-blur-2xl border border-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.10)] rounded-2xl px-5"
              : "bg-white/95 backdrop-blur-md border-b border-slate-100/80 shadow-sm px-4 sm:px-6 lg:px-8"
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between h-[60px]">

            {/* ── Logo ── */}
            <motion.div
              className="flex items-center gap-2.5 select-none cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
            >
              <div className={`flex items-center justify-center rounded-xl shadow-md shadow-green-200 transition-all duration-300 ${
                scrolled ? "w-8 h-8" : "w-9 h-9"
              } bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500`}>
                <HeartPulse size={scrolled ? 16 : 18} className="text-white" />
              </div>
              <span className={`font-extrabold tracking-tight text-slate-900 transition-all duration-300 ${
                scrolled ? "text-lg" : "text-xl"
              }`}>
                Medi
                <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                  Pulse
                </span>
              </span>
            </motion.div>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(({ label, href }, i) => (
                <motion.a
                  key={href}
                  href={href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.05 }}
                  className="relative text-sm font-semibold text-slate-500 hover:text-green-700 transition-colors group"
                >
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400 group-hover:w-full transition-all duration-300 rounded-full" />
                </motion.a>
              ))}
            </div>

            {/* ── Desktop Actions ── */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* Accessibility & Language Menu */}
              <AccessibilityMenu inlineTrigger={true} />

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="relative p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              </motion.button>

              {isLoggedIn ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDashboard}
                    className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-2 rounded-xl shadow-md shadow-green-300/40 transition-all"
                  >
                    <LayoutDashboard size={16} /> {t("patient.dashboard")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title={t("nav.logout")}
                  >
                    <LogOut size={18} />
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/login", { state: { view: "sign_in" } })}
                    className="text-sm font-bold text-green-700 hover:bg-green-50 border border-green-100 hover:border-green-200 px-4 py-2 rounded-xl transition-all"
                  >
                    {t("auth.signIn")}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: "0 6px 20px rgba(16,185,129,0.38)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/login", { state: { view: "sign_up" } })}
                    className="text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-2 rounded-xl shadow-md shadow-green-300/40 transition-all"
                  >
                    {t("auth.signUp")}
                  </motion.button>
                </>
              )}
            </div>

            {/* ── Mobile Hamburger ── */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait">
                {mobileOpen
                  ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}><X size={22} /></motion.div>
                  : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}><Menu size={22} /></motion.div>
                }
              </AnimatePresence>
            </motion.button>
          </div>

          {/* ── Mobile Drawer ── */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="md:hidden overflow-hidden border-t border-slate-100"
              >
                <div className="py-4 space-y-1">
                  {NAV_LINKS.map(({ label, href }, i) => (
                    <motion.a
                      key={href}
                      href={href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="block px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-green-700 rounded-xl hover:bg-green-50 transition-colors"
                    >
                      {label}
                    </motion.a>
                  ))}

                  {/* Accessibility & Language toggle mobile */}
                  <div className="px-1 pt-2">
                    <LanguageToggleTab className="w-full" />
                  </div>

                  <div className="pt-3 flex flex-col gap-2">
                    {isLoggedIn ? (
                      <>
                        <button
                          onClick={handleDashboard}
                          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-500 py-2.5 rounded-xl shadow-sm transition-all"
                        >
                          <LayoutDashboard size={16} /> {t("patient.dashboard")}
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-rose-600 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut size={16} /> {t("nav.logout")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate("/login", { state: { view: "sign_in" } })}
                          className="w-full text-sm font-bold text-green-700 py-2.5 rounded-xl border border-green-200 hover:bg-green-50 transition-colors"
                        >
                          {t("auth.signIn")}
                        </button>
                        <button
                          onClick={() => navigate("/login", { state: { view: "sign_up" } })}
                          className="w-full text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-500 py-2.5 rounded-xl shadow-sm transition-all"
                        >
                          {t("auth.signUp")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </motion.header>
  );
}
