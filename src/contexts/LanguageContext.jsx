import { createContext, useContext, useState, useCallback, useMemo } from "react";
import en from "../locales/en.json";
import bn from "../locales/bn.json";

const LOCALES = { en, bn };
const STORAGE_KEY = "medipulse_lang_v2";

const LanguageContext = createContext(null);

/**
 * useLanguage — access the global language context.
 * Returns { lang, setLang, t }
 *   lang    → "en" | "bn"
 *   setLang → (lang: "en" | "bn") => void
 *   t       → (key: string, fallback?: string) => string
 *             key format: "section.key"  e.g. "doctor.bookAppointment"
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || "bn"; }
    catch { return "bn"; }
  });

  const setLang = useCallback((newLang) => {
    if (!["en", "bn"].includes(newLang)) return;
    setLangState(newLang);
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch { /* ignore */ }
  }, []);

  /**
   * t("section.key")  → translated string
   * Falls back to English if key is missing in the active locale.
   * Falls back to the key itself if missing in both.
   */
  const t = useCallback((key, fallbackText) => {
    const parts   = key.split(".");
    const section = parts[0];
    const field   = parts.slice(1).join(".");

    const locale = LOCALES[lang]   || {};
    const enLocale = LOCALES["en"] || {};

    const val    = locale[section]?.[field];
    const enVal  = enLocale[section]?.[field];

    if (val !== undefined && val !== null) return val;
    if (enVal !== undefined && enVal !== null) return enVal;
    if (fallbackText) return fallbackText;

    // Development warning for missing keys
    if (import.meta.env.DEV) {
      console.warn(`[i18n] Missing translation key: "${key}" for lang="${lang}"`);
    }
    return field; // Return the key field as last resort (never undefined/null)
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
