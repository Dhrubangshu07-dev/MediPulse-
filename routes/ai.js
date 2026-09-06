const express = require("express");
const router = express.Router();

// Simulated AI endpoint for symptom analysis
router.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const input = text.toLowerCase();
    
    let specialty = "General Physician";
    let condition = "Unknown condition";
    let severity = "low";

    // Very simple keyword matching algorithm
    if (input.includes("headache") || input.includes("migraine") || input.includes("dizzy")) {
      specialty = "Neurologist";
      condition = "Tension Headache / Migraine";
      severity = "medium";
    } else if (input.includes("heart") || input.includes("chest") || input.includes("palpitation")) {
      specialty = "Cardiologist";
      condition = "Cardiac evaluation needed";
      severity = "high";
    } else if (input.includes("stomach") || input.includes("nausea") || input.includes("vomit")) {
      specialty = "Gastroenterologist";
      condition = "Gastrointestinal issue";
      severity = "medium";
    } else if (input.includes("skin") || input.includes("rash") || input.includes("itch")) {
      specialty = "Dermatologist";
      condition = "Skin irritation";
      severity = "low";
    } else if (input.includes("bone") || input.includes("fracture") || input.includes("joint") || input.includes("knee")) {
      specialty = "Orthopedist";
      condition = "Musculoskeletal issue";
      severity = "medium";
    }

    // Delay to simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.json({
      success: true,
      analysis: {
        condition,
        specialty,
        severity,
        recommendation: severity === "high" 
          ? "Please seek immediate medical attention or visit an emergency room."
          : `We recommend consulting a ${specialty} for these symptoms. Would you like to see available doctors?`
      }
    });
  } catch (error) {
    console.error("AI Analysis error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

module.exports = router;
