const express = require("express");
const router  = express.Router();
const supabaseDb = require("../lib/supabaseDb");

/**
 * GET /api/patients
 * List all registered patients.
 * Used by AdminDashboard for patient synchronization & verification.
 */
router.get("/", async (_req, res) => {
  try {
    const patients = await supabaseDb.getPatients();
    return res.json({ success: true, count: patients.length, data: patients });
  } catch (err) {
    console.error("Error fetching patients:", err.message);
    return res.status(500).json({ success: false, error: "Unable to load patients. Please try again." });
  }
});

/**
 * GET /api/patients/me?email=...
 * Fetch patient profile including verification status.
 */
router.get("/me", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email query param is required" });
  }

  try {
    const patient = await supabaseDb.getPatientByEmail(email);
    if (!patient) {
      return res.status(404).json({ success: false, error: "Patient not found" });
    }
    return res.json({ success: true, data: patient });
  } catch (err) {
    console.error("Error fetching patient by email:", err.message);
    return res.status(500).json({ success: false, error: "Unable to load patient profile." });
  }
});

/**
 * PUT /api/patients/:id/status
 * Update patient status (ACTIVE, PENDING_VERIFICATION, BLOCKED).
 */
router.put("/:id/status", async (req, res) => {
  const { status } = req.body;
  const valid = ["ACTIVE", "PENDING_VERIFICATION", "BLOCKED"];
  if (!status || !valid.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${valid.join(", ")}` });
  }

  try {
    const updated = await supabaseDb.updatePatientStatus(req.params.id, status);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Error updating patient status:", err.message);
    return res.status(500).json({ success: false, error: "Failed to update patient status." });
  }
});

module.exports = router;
