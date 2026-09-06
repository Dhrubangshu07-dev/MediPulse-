import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Calendar, CheckCircle, ChevronLeft,
  Clock, Mail, Phone, Shield, User, X, Sparkles,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { syncBus, SYNC_EVENTS } from "../utils/syncBus";

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM",
];

const BOOKED_SLOTS = ["10:00 AM", "03:00 PM", "05:30 PM"];

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40, transition: { duration: 0.2 } }),
};

export default function BookingModal({ doctor, onClose }) {
  const { t, lang } = useLanguage();
  const [step, setStep]           = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedDate, setDate]   = useState(null);
  const [selectedSlot, setSlot]   = useState(null);
  const [form, setForm]           = useState({ name: "", phone: "", email: "", reason: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const BOOKING_STEPS = [
    t("bookingModal.step1", "Select Date"),
    t("bookingModal.step2", "Choose Time"),
    t("bookingModal.step3", "Your Info"),
    t("bookingModal.step4", "Confirm"),
  ];

  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const fmtDate = (d) =>
    d.toLocaleDateString(lang === "bn" ? "bn-IN" : "en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const canContinue =
    (step === 1 && selectedDate) ||
    (step === 2 && selectedSlot) ||
    (step === 3 && form.name.trim() && form.phone.trim() && form.email.trim()) ||
    step === 4;

  const handleFormChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const goNext = () => { setDirection(1); setStep((s) => s + 1); };
  const goPrev = () => { setDirection(-1); setStep((s) => s - 1); };

  const handleConfirmBooking = async () => {
    setIsBooking(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor.id,
          date: selectedDate.toISOString(),
          slot: selectedSlot,
          patient: {
            name: form.name,
            phone: form.phone,
            email: form.email,
            reason: form.reason,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmed(true);
        syncBus.emit(SYNC_EVENTS.APPOINTMENT_CREATED, {
          appointment: data.data,
          doctorId: doctor.id,
        });
      } else {
        alert(t("appointment.bookingError", "Failed to book appointment: ") + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Booking error:", err);
      alert(t("common.error", "Something went wrong during booking."));
    } finally {
      setIsBooking(false);
    }
  };

  // ── Confirmed ──────────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 18 }}
            className="w-24 h-24 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle size={48} className="text-green-500" />
          </motion.div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
            {t("bookingModal.bookingConfirmed", "Booking Confirmed! 🎉")}
          </h2>
          <p className="text-slate-500 text-sm mb-1">
            <strong className="text-slate-800">{doctor.name}</strong> — {t("bookingModal.confirmedDesc", "Your appointment is confirmed.")}
          </p>
          <p className="text-green-600 font-bold text-base mt-2 mb-1">
            {selectedDate && fmtDate(selectedDate)} · {selectedSlot}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed mb-8">
            {t("bookingModal.confirmationSent", "Confirmation sent to")}{" "}
            <span className="font-semibold text-slate-600">{form.email || "your email"}</span>.{" "}
            {t("bookingModal.reminderNotice", "You'll receive a reminder 30 minutes before your consultation.")}
          </p>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              {t("bookingModal.close", "Close")}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(16,185,129,0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-2xl text-sm font-bold shadow-lg"
            >
              {t("bookingModal.payViaRazorpay", "Pay via Razorpay ₹")}{doctor.fee}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main modal ─────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[488px] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* ── Header ── */}
        <div className="bg-[radial-gradient(ellipse_at_top_left,_#065f46,_#047857,_#059669)] px-6 pt-6 pb-7 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

          <div className="flex items-center justify-between mb-5 relative z-10">
            <div>
              <h2 className="text-base font-extrabold text-white">
                {t("bookingModal.title", "Book Appointment")}
              </h2>
              <p className="text-green-200/70 text-xs mt-0.5">
                {t("bookingModal.step", "Step")} {step} {t("bookingModal.of", "of")} {BOOKING_STEPS.length}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
              aria-label="Close"
            >
              <X size={16} className="text-white" />
            </motion.button>
          </div>

          {/* Doctor mini-card */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3 mb-5 relative z-10">
            <img
              src={doctor.image || doctor.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.name || "Doctor")}`}
              alt={doctor.name}
              loading="lazy"
              className="w-12 h-12 rounded-xl object-cover shrink-0 ring-2 ring-white/20"
            />
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">{doctor.name}</div>
              <div className="text-xs text-green-100/80">
                {doctor.specialty} · ₹{doctor.fee}
              </div>
            </div>
            <div className="ml-auto shrink-0">
              <Sparkles size={16} className="text-green-300 animate-pulse" />
            </div>
          </div>

          {/* Step progress */}
          <div className="flex gap-1.5 relative z-10">
            {BOOKING_STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <motion.div
                  className="h-1.5 rounded-full"
                  initial={false}
                  animate={{ backgroundColor: i + 1 <= step ? "#ffffff" : "rgba(255,255,255,0.2)" }}
                  transition={{ duration: 0.3 }}
                />
                <div className={`text-[10px] mt-1 font-semibold text-center transition-colors ${
                  i + 1 <= step ? "text-white" : "text-white/35"
                }`}>
                  {s}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="p-6"
            >

              {/* Step 1 — Date */}
              {step === 1 && (
                <div>
                  <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 mb-4">
                    <Calendar size={18} className="text-green-600" /> {t("bookingModal.selectDate", "Select a Date")}
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {dates.map((d, i) => {
                      const isSel = selectedDate?.toDateString() === d.toDateString();
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={() => setDate(d)}
                          className={`flex flex-col items-center py-3 px-1 rounded-2xl border text-sm font-medium transition-all ${
                            isSel
                              ? "bg-gradient-to-br from-green-600 to-emerald-500 border-transparent text-white shadow-lg shadow-green-200"
                              : "border-slate-200 text-slate-700 hover:border-green-300 hover:bg-green-50 bg-white"
                          }`}
                        >
                          <span className={`text-[10px] font-bold uppercase ${isSel ? "text-green-200" : "text-slate-400"}`}>
                            {d.toLocaleDateString(lang === "bn" ? "bn-IN" : "en-IN", { weekday: "short" })}
                            {i === 0 && <span className={`ml-1 ${isSel ? "text-green-300" : "text-green-400"}`}>•</span>}
                          </span>
                          <span className="text-lg font-extrabold mt-0.5">{d.getDate()}</span>
                          <span className={`text-[10px] ${isSel ? "text-green-200" : "text-slate-400"}`}>
                            {d.toLocaleDateString(lang === "bn" ? "bn-IN" : "en-IN", { month: "short" })}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2 — Time */}
              {step === 2 && (
                <div>
                  <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 mb-1">
                    <Clock size={18} className="text-green-600" /> {t("bookingModal.chooseTime", "Choose a Time Slot")}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {selectedDate && fmtDate(selectedDate)} · {t("bookingModal.timeZoneHint", "All times in IST")}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isBooked = BOOKED_SLOTS.includes(slot);
                      const isSel = selectedSlot === slot;
                      return (
                        <motion.button
                          key={slot}
                          whileHover={!isBooked ? { scale: 1.04 } : {}}
                          whileTap={!isBooked ? { scale: 0.96 } : {}}
                          disabled={isBooked}
                          onClick={() => !isBooked && setSlot(slot)}
                          className={`py-3 text-xs font-bold rounded-2xl border transition-all ${
                            isBooked
                              ? "bg-slate-50 border-slate-100 text-slate-300 line-through cursor-not-allowed"
                              : isSel
                              ? "bg-gradient-to-br from-green-600 to-emerald-500 border-transparent text-white shadow-md shadow-green-100"
                              : "border-slate-200 text-slate-700 hover:border-green-300 hover:bg-green-50 bg-white"
                          }`}
                        >
                          {slot}
                        </motion.button>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-4 text-xs text-slate-400">
                    {[
                      { color: "bg-gradient-to-br from-green-600 to-emerald-500", label: t("bookingModal.selected", "Selected") },
                      { color: "bg-slate-200", label: t("bookingModal.booked", "Booked") },
                      { color: "border border-slate-200 bg-white", label: t("bookingModal.available", "Available") },
                    ].map(({ color, label }) => (
                      <span key={label} className="flex items-center gap-1.5">
                        <span className={`w-3 h-3 rounded ${color} inline-block`} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — Patient info */}
              {step === 3 && (
                <div>
                  <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 mb-5">
                    <User size={18} className="text-green-600" /> {t("bookingModal.yourInfo", "Your Information")}
                  </h3>
                  <div className="space-y-4">
                    {[
                      { key: "name",  label: t("bookingModal.fullName", "Full Name"),     placeholder: "রহিম ইসলাম / John Doe",     Icon: User,  type: "text"  },
                      { key: "phone", label: t("bookingModal.phoneNumber", "Phone Number"),  placeholder: "+91 98765 43210",          Icon: Phone, type: "tel"   },
                      { key: "email", label: t("bookingModal.emailAddress", "Email Address"), placeholder: "you@example.com",          Icon: Mail,  type: "email" },
                    ].map(({ key, label, placeholder, Icon, type }) => (
                      <div key={key}>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-500/10 focus-within:bg-white transition-all">
                          <Icon size={15} className="text-slate-400 shrink-0" />
                          <input
                            type={type}
                            value={form[key]}
                            onChange={(e) => handleFormChange(key, e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 text-sm text-slate-800 outline-none bg-transparent placeholder-slate-400"
                          />
                        </div>
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">
                        {t("bookingModal.reasonForVisit", "Reason for Visit")}{" "}
                        <span className="font-normal text-slate-400">{t("bookingModal.optional", "(optional)")}</span>
                      </label>
                      <textarea
                        rows={3}
                        value={form.reason}
                        onChange={(e) => handleFormChange("reason", e.target.value)}
                        placeholder={t("bookingModal.reasonPlaceholder", "Briefly describe your symptoms or concerns…")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10 focus:bg-white transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 — Review */}
              {step === 4 && (
                <div>
                  <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 mb-5">
                    <CheckCircle size={18} className="text-green-600" /> {t("bookingModal.reviewAndConfirm", "Review & Confirm")}
                  </h3>
                  <div className="bg-gradient-to-br from-slate-50 to-green-50/30 border border-slate-200 rounded-2xl p-5 space-y-3.5">
                    {[
                      { label: t("bookingModal.doctor", "Doctor"),           value: doctor.name },
                      { label: t("bookingModal.specialty", "Specialty"),        value: doctor.specialty },
                      { label: t("bookingModal.hospital", "Hospital"),         value: doctor.hospital },
                      { label: t("bookingModal.date", "Date"),             value: selectedDate ? fmtDate(selectedDate) : "—" },
                      { label: t("bookingModal.time", "Time"),             value: selectedSlot || "—" },
                      { label: t("bookingModal.patient", "Patient"),          value: form.name  || "—" },
                      { label: t("bookingModal.contact", "Contact"),          value: form.phone || "—" },
                      { label: t("bookingModal.consultationFee", "Consultation Fee"), value: `₹${doctor.fee}`, highlight: true },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 font-medium">{label}</span>
                        <span className={`font-bold ${highlight ? "text-green-600 text-base" : "text-slate-900"}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-start gap-2 text-xs text-slate-400 bg-slate-50 rounded-2xl p-3">
                    <Shield size={13} className="text-green-500 mt-0.5 shrink-0" />
                    <span>
                      {t("bookingModal.encryptedNotice", "Your data is encrypted end-to-end. Payment is processed securely via Razorpay.")}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-5 pt-3 flex gap-3 border-t border-slate-100 shrink-0 bg-white">
          {step > 1 && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={goPrev}
              className="flex items-center gap-1.5 px-5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={16} /> {t("bookingModal.back", "Back")}
            </motion.button>
          )}

          {step < 4 ? (
            <motion.button
              whileHover={canContinue ? { scale: 1.02, boxShadow: "0 8px 20px rgba(16,185,129,0.3)" } : {}}
              whileTap={canContinue ? { scale: 0.98 } : {}}
              onClick={goNext}
              disabled={!canContinue}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-2xl transition-all shadow-md shadow-green-200 disabled:shadow-none"
            >
              {t("bookingModal.continue", "Continue")} <ArrowRight size={16} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={!isBooking ? { scale: 1.02, boxShadow: "0 8px 20px rgba(16,185,129,0.35)" } : {}}
              whileTap={!isBooking ? { scale: 0.98 } : {}}
              onClick={handleConfirmBooking}
              disabled={isBooking}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-bold py-3 rounded-2xl shadow-lg shadow-green-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isBooking
                ? t("bookingModal.confirming", "Confirming...")
                : `${t("bookingModal.confirmAndPay", "Confirm & Pay ₹")}${doctor.fee}`}{" "}
              <ArrowRight size={16} />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
