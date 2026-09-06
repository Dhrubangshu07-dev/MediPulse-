const express = require("express");
const router  = express.Router();
const supabaseDb = require("../lib/supabaseDb");

// GET /api/pharmacist/prescriptions
router.get("/prescriptions", async (_req, res) => {
  try {
    const list = await supabaseDb.getPharmacistPrescriptions();
    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    console.error("Error fetching pharmacist prescriptions:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch prescriptions" });
  }
});

// PATCH /api/pharmacist/prescriptions/:id/dispense
router.patch("/prescriptions/:id/dispense", async (req, res) => {
  try {
    const { id } = req.params;
    const { pharmacistId } = req.body;

    const updated = await supabaseDb.dispensePrescription(id, pharmacistId);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error dispensing prescription:", error.message);
    res.status(500).json({ success: false, error: "Failed to dispense prescription" });
  }
});

module.exports = router;
