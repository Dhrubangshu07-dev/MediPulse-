const express = require("express");
const router  = express.Router();
const supabaseDb = require("../lib/supabaseDb");

// GET /api/prescriptions
router.get("/", async (req, res) => {
  try {
    const { patientId, appointmentId } = req.query;
    const prescriptions = await supabaseDb.getPrescriptions({ patientId, appointmentId });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error("Error fetching prescriptions:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch prescriptions" });
  }
});

// POST /api/prescriptions
router.post("/", async (req, res) => {
  try {
    const { appointmentId, patientId, medicines, notes } = req.body;

    if (!appointmentId || !patientId) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const prescription = await supabaseDb.createPrescription({
      appointmentId,
      patientId,
      medicines,
      notes,
    });

    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    console.error("Error saving prescription:", error.message);
    res.status(500).json({ success: false, error: "Failed to save prescription" });
  }
});

module.exports = router;
