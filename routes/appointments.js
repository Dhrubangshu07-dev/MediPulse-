const express = require("express");
const router  = express.Router();
const supabaseDb = require("../lib/supabaseDb");

// ── GET /api/appointments ──────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const { patientEmail, patientId, doctorId, status } = req.query;

  try {
    const appointments = await supabaseDb.getAppointments({
      patientEmail,
      patientId,
      doctorId,
      status,
    });

    return res.json({ success: true, count: appointments.length, data: appointments });
  } catch (err) {
    console.error("Error fetching appointments:", err.message);
    return res.status(500).json({ success: false, error: "Unable to load appointments. Please try again." });
  }
});

// ── GET /api/appointments/:id ──────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  if (req.params.id === "status") return;
  try {
    const appt = await supabaseDb.getAppointmentById(req.params.id);
    if (appt) return res.json({ success: true, data: appt });
    return res.status(404).json({ success: false, error: "Appointment not found." });
  } catch (err) {
    console.error("Error fetching appointment:", err.message);
    return res.status(500).json({ success: false, error: "Unable to load appointment. Please try again." });
  }
});

// ── POST /api/appointments ─────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { doctorId, date, slot, patient } = req.body;

  if (!doctorId || !date || !slot || !patient?.name) {
    return res.status(400).json({
      success: false,
      error: "doctorId, date, slot, and patient.name are required",
    });
  }

  try {
    const appointment = await supabaseDb.createAppointment({
      doctorId,
      date,
      slot,
      patient,
    });

    return res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    console.error("Error creating appointment:", err.message);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: err.message || "Failed to book appointment. Please try again.",
    });
  }
});

// ── PUT /api/appointments/:id/status ───────────────────────────────────────────
router.put("/:id/status", async (req, res) => {
  const { status } = req.body;
  const valid = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];
  if (!status || !valid.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${valid.join(", ")}` });
  }

  try {
    const updated = await supabaseDb.updateAppointmentStatus(req.params.id, status);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Error updating appointment status:", err.message);
    return res.status(500).json({ success: false, error: "Failed to update status." });
  }
});

module.exports = router;
