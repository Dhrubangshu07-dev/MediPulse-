/**
 * slots.js
 * Available and booked time slots — extracted from MediPulse.jsx
 * In production, bookedSlots would come from a DB query per doctor per date.
 */

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM",
];

// Tracks booked slots in memory (would be a DB table in production)
let BOOKED_SLOTS = ["10:00 AM", "03:00 PM", "05:30 PM"];

/**
 * Returns all slots with an `isBooked` flag.
 */
function getSlotsWithAvailability() {
  return TIME_SLOTS.map((slot) => ({
    slot,
    isBooked: BOOKED_SLOTS.includes(slot),
  }));
}

/**
 * Books a slot. Returns true on success, false if already booked.
 * @param {string} slot - e.g. "09:00 AM"
 */
function bookSlot(slot) {
  if (!TIME_SLOTS.includes(slot)) return { ok: false, error: "Invalid slot" };
  if (BOOKED_SLOTS.includes(slot)) return { ok: false, error: "Slot already booked" };
  BOOKED_SLOTS.push(slot);
  return { ok: true, slot };
}

module.exports = { TIME_SLOTS, BOOKED_SLOTS, getSlotsWithAvailability, bookSlot };
