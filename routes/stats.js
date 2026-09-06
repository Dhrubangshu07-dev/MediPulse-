const express = require("express");
const router  = express.Router();
const supabaseDb = require("../lib/supabaseDb");

/**
 * GET /api/stats
 * Returns aggregate dashboard statistics.
 * Used by AdminDashboard analytics.
 */
router.get("/", async (_req, res) => {
  try {
    const stats = await supabaseDb.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("Error fetching stats:", err.message);
    res.status(500).json({ success: false, error: "Unable to load statistics. Please try again." });
  }
});

module.exports = router;
