const express = require("express");
const router  = express.Router();

/**
 * GET /api/vitals
 * Returns realistic vitals for patient dashboard display.
 */
router.get("/", (_req, res) => {
  const vitals = [
    { label: "Blood Pressure", value: "120/80", unit: "mmHg", trend: "Normal" },
    { label: "Heart Rate",     value: "72",     unit: "bpm",  trend: "+2 bpm from avg" },
    { label: "Temperature",    value: "98.6",   unit: "°F",   trend: "Normal" },
    { label: "O₂ Saturation",  value: "99",     unit: "%",    trend: "Optimal" },
  ];
  res.json({ success: true, data: vitals });
});

module.exports = router;
