import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * useDynamicTranslation
 * 
 * Fetches translations for dynamic user-generated text (e.g., doctor bios)
 * from our /api/translate backend, which interfaces with LibreTranslate/Google API.
 * 
 * @param {string} text - The text to translate
 * @returns {string} - The translated text (or original text if loading/failed)
 */
export function useDynamicTranslation(text) {
  const { lang } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    // If language is English or text is empty, no translation needed
    if (lang === "en" || !text) {
      setTranslatedText(text);
      return;
    }

    let isMounted = true;

    async function translate() {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            sourceLang: "en",
            targetLang: lang,
          }),
        });

        const json = await res.json();
        if (json.success && isMounted) {
          setTranslatedText(json.data || text);
        }
      } catch (err) {
        console.error("Dynamic translation failed:", err);
        if (isMounted) setTranslatedText(text); // fallback to original
      }
    }

    translate();

    return () => { isMounted = false; };
  }, [text, lang]);

  return translatedText;
}
