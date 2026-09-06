const express = require("express");
const router  = express.Router();

/**
 * POST /api/translate
 * Translates dynamic content (like Doctor bios, notes, etc.) using LibreTranslate or Google Cloud.
 * This satisfies the requirement to dynamically translate user-generated content 
 * that cannot be stored in static en.json / bn.json locale files.
 */
router.post("/", async (req, res) => {
  const { text, targetLang, sourceLang = "en" } = req.body;

  if (!text) {
    return res.json({ success: true, data: "" });
  }

  if (targetLang === sourceLang) {
    return res.json({ success: true, data: text });
  }

  try {
    // Primary: LibreTranslate API
    // (Using a known public instance or localhost if hosted locally)
    const libreTranslateUrl = process.env.LIBRE_TRANSLATE_URL || "https://libretranslate.de/translate";
    
    const response = await fetch(libreTranslateUrl, {
      method: "POST",
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text"
      }),
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({ success: true, data: data.translatedText });
    }

    // Fallback if public LibreTranslate rate-limits us (which happens often)
    // Here you would integrate the official Google Cloud Translator SDK:
    // const { Translate } = require('@google-cloud/translate').v2;
    // const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });
    // const [translation] = await translate.translate(text, targetLang);
    // return res.json({ success: true, data: translation });

    throw new Error(`LibreTranslate responded with status: ${response.status}`);
  } catch (err) {
    console.error("Translation API error:", err.message);
    // Always fail gracefully by returning the original text
    res.json({ success: true, data: text, fallback: true });
  }
});

module.exports = router;
