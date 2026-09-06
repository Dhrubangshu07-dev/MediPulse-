/**
 * server.js
 * MediPulse Express API entry point
 *
 * Usage:
 *   npm run dev    → nodemon (hot reload)
 *   npm start      → plain node
 *
 * Base URL: http://localhost:5000/api
 */

const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const doctorsRouter       = require("./routes/doctors");
const slotsRouter         = require("./routes/slots");
const appointmentsRouter  = require("./routes/appointments");
const aiRouter            = require("./routes/ai");
const prescriptionsRouter = require("./routes/prescriptions");
const pharmacistRouter    = require("./routes/pharmacist");
const vitalsRouter        = require("./routes/vitals");
const statsRouter         = require("./routes/stats");
const translateRouter     = require("./routes/translate");
const patientsRouter      = require("./routes/patients");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/doctors",       doctorsRouter);
app.use("/api/slots",         slotsRouter);
app.use("/api/appointments",  appointmentsRouter);
app.use("/api/patients",      patientsRouter);
app.use("/api/ai",            aiRouter);
app.use("/api/vitals",        vitalsRouter);
app.use("/api/prescriptions", prescriptionsRouter);
app.use("/api/pharmacist",    pharmacistRouter);
app.use("/api/stats",         statsRouter);
app.use("/api/translate",     translateRouter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, error: "Route not found" })
);

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏥  MediPulse API running at http://localhost:${PORT}/api`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/doctors`);
  console.log(`   GET  /api/slots`);
  console.log(`   GET  /api/stats`);
  console.log(`   POST /api/appointments\n`);
});
