import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accessibility, X, Globe, Check, Sliders,
  Type, Eye, RefreshCw, Sparkles
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * Standalone Language Toggle Tab:
 * Switches between English and Bengali with active tab highlight
 */
export function LanguageToggleTab({ className = "" }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className={`p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-1 shadow-inner ${className}`}>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 relative ${
          lang === "en"
            ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-md shadow-slate-300/40 dark:shadow-emerald-900/40"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <span className="text-sm">🇬🇧</span>
        <span>{t("accessibility.english", "English")}</span>
        {lang === "en" && (
          <motion.span
            layoutId="activeLangDot"
            className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-white"
          />
        )}
      </button>

      <button
        type="button"
        onClick={() => setLang("bn")}
        aria-pressed={lang === "bn"}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 relative ${
          lang === "bn"
            ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-md shadow-slate-300/40 dark:shadow-emerald-900/40"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <span className="text-sm">🇧🇩</span>
        <span>{t("accessibility.bengali", "বাংলা")}</span>
        {lang === "bn" && (
          <motion.span
            layoutId="activeLangDot"
            className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-white"
          />
        )}
      </button>
    </div>
  );
}

/**
 * Main Accessibility Menu component with floating trigger and full preferences modal/popover
 */
export default function AccessibilityMenu({ inlineTrigger = false, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const [fontSize, setFontSize] = useState("normal"); // 'normal' | 'large' | 'xl'
  const [highContrast, setHighContrast] = useState(false);

  // Apply font size scaling to html root
  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === "normal") {
      root.style.fontSize = "16px";
    } else if (fontSize === "large") {
      root.style.fontSize = "18px";
    } else if (fontSize === "xl") {
      root.style.fontSize = "20px";
    }
  }, [fontSize]);

  // Apply high contrast mode
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
  }, [highContrast]);

  const resetPreferences = () => {
    setFontSize("normal");
    setHighContrast(false);
  };

  const handleToggle = () => setIsOpen((prev) => !prev);
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <>
      {/* ── Trigger Button (Floating or Inline) ── */}
      {!inlineTrigger ? (
        <div className="fixed bottom-6 right-6 z-50">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleToggle}
            aria-label="Open Accessibility and Language Menu"
            className="flex items-center gap-2 px-3.5 py-3 rounded-full bg-slate-900/90 dark:bg-slate-800/95 text-white border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl hover:border-emerald-500/50 hover:shadow-emerald-500/20 transition-all duration-300 group"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Accessibility size={16} />
            </div>
            <span className="text-xs font-bold tracking-wide pr-1 hidden sm:inline">
              {lang === "bn" ? "বাংলা / EN" : "EN / বাংলা"}
            </span>
          </motion.button>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md text-xs font-bold transition-all shadow-sm"
          aria-label="Accessibility Menu"
        >
          <Accessibility size={16} className="text-emerald-500" />
          <span>{lang === "bn" ? "বাংলা" : "EN"}</span>
        </motion.button>
      )}

      {/* ── Accessibility & Language Modal / Popover ── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
            {/* Backdrop click to dismiss */}
            <div className="absolute inset-0" onClick={handleClose} />

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-[2rem] sm:rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden z-10 space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Accessibility size={22} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      {t("accessibility.menuTitle", "Accessibility & Preferences")}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      {t("accessibility.selectLanguage", "Customize your reading and language experience")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Section 1: Language Toggle Tab */}
              <div className="space-y-2.5">
                <label className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Globe size={14} className="text-emerald-500" />
                    {t("accessibility.language", "Language / ভাষা")}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 lowercase">
                    {lang === "bn" ? "সক্রিয়: বাংলা" : "Active: English"}
                  </span>
                </label>

                {/* THE REQUESTED TOGGLE TAB */}
                <LanguageToggleTab />
              </div>

              {/* Section 2: Text Size */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Type size={14} className="text-blue-500" />
                  {t("accessibility.fontSize", "Text Size")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "normal", label: t("accessibility.normal", "Normal"), sizeText: "A" },
                    { id: "large", label: t("accessibility.large", "Large"), sizeText: "A+" },
                    { id: "xl", label: t("accessibility.extraLarge", "XL"), sizeText: "A++" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFontSize(opt.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        fontSize === opt.id
                          ? "bg-blue-50 dark:bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="font-extrabold">{opt.sizeText}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3: Visual Preferences */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Eye size={14} className="text-purple-500" />
                  {t("accessibility.highContrast", "High Contrast")}
                </label>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("accessibility.highContrast", "High Contrast Mode")}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={highContrast}
                      onChange={(e) => setHighContrast(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetPreferences}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <RefreshCw size={13} />
                  <span>{t("accessibility.reset", "Reset Defaults")}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-900/20 hover:from-emerald-500 hover:to-teal-400 transition-all"
                >
                  {t("common.confirm", "Done")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
