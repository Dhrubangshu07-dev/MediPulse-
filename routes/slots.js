const express = require("express");
const router = express.Router();
const supabaseDb = require("../lib/supabaseDb");

// GET /api/slots
router.get("/", async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    const availableSlots = await supabaseDb.getSlots(doctorId, date);
    res.json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    console.error("Error fetching slots:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

module.exports = router;
