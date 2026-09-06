const express = require("express");
const router  = express.Router();
const supabaseDb = require("../lib/supabaseDb");

// ── GET /api/doctors ───────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { specialty } = req.query;
    const doctors = await supabaseDb.getDoctors(specialty);
    return res.json({ success: true, count: doctors.length, data: doctors });
  } catch (err) {
    console.error("Error fetching doctors:", err.message);
    return res.status(500).json({ success: false, error: "Unable to load doctors. Please try again." });
  }
});

// ── GET /api/doctors/me — by auth token email ──────────────────────────────────
router.get("/me", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ success: false, error: "email query param required" });
    }

    const doctor = await supabaseDb.getDoctorByEmail(email);
    if (!doctor) {
      return res.status(404).json({ success: false, error: "Doctor profile not found for this account." });
    }

    return res.json({ success: true, data: doctor });
  } catch (err) {
    console.error("Error fetching doctor profile:", err.message);
    return res.status(500).json({ success: false, error: "Unable to load doctor profile. Please try again." });
  }
});

// ── GET /api/doctors/:id ───────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const doctor = await supabaseDb.getDoctorById(req.params.id);
    if (doctor) return res.json({ success: true, data: doctor });
    return res.status(404).json({ success: false, error: "Doctor not found." });
  } catch (err) {
    console.error("Error fetching doctor:", err.message);
    return res.status(500).json({ success: false, error: "Unable to load doctor information. Please try again." });
  }
});

// ── POST /api/doctors ──────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const {
    name, email, avatarUrl, specialty, specialization, hospital, nextSlot,
    consultType, fee, experience, qualification, registrationNo, bio,
    available, isVerified, status,
  } = req.body;

  if (!name || !email || !(specialty || specialization)) {
    return res.status(400).json({ success: false, error: "name, email, and specialty are required." });
  }

  try {
    const doctor = await supabaseDb.createDoctor({
      name,
      email,
      avatarUrl,
      specialization: specialization || specialty,
      qualification,
      experience,
      fee,
      bio,
      status: status || (available !== false ? "AVAILABLE" : "OFFLINE"),
      isVerified,
    });
    return res.status(201).json({ success: true, data: doctor });
  } catch (err) {
    console.error("Error creating doctor:", err.message);
    return res.status(500).json({ success: false, error: "Failed to create doctor: " + err.message });
  }
});

// ── PUT /api/doctors/:id ───────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const updated = await supabaseDb.updateDoctor(req.params.id, req.body);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Error updating doctor:", err.message);
    return res.status(500).json({ success: false, error: "Failed to update doctor: " + err.message });
  }
});

// ── DELETE /api/doctors/:id ────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await supabaseDb.deleteDoctor(req.params.id);
    return res.json({ success: true, message: "Doctor removed." });
  } catch (err) {
    console.error("Error deleting doctor:", err.message);
    return res.status(500).json({ success: false, error: "Failed to delete doctor: " + err.message });
  }
});

module.exports = router;
