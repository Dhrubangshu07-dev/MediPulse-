/**
 * ui.js
 * Pure UI-only constants — extracted from MediPulse.jsx.
 * These never touch the network; they drive local component rendering only.
 */

/** Labels for the 4-step booking modal progress bar */
export const BOOKING_STEPS = ["Select Date", "Choose Time", "Your Info", "Confirm"];

/** Doctor grid filter chip options */
export const FILTER_OPTIONS = ["All", "Cardiologist", "Neurologist", "Pediatrician", "Dermatologist"];

/** Quick-pick symptom suggestions for the AI chat widget */
export const SUGGESTIONS = [
  "Chest pain and shortness of breath",
  "Persistent headache",
  "Skin rash and itching",
];

/** Specialist pool used by the mocked AI symptom checker */
export const SPECIALIST_POOL = [
  "Cardiologist",
  "Neurologist",
  "Dermatologist",
  "Pulmonologist",
  "Gastroenterologist",
];
