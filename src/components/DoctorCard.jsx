import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Calendar, Clock, Heart, Star } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * DoctorCard
 * Props:
 *   doctor  — doctor object from the doctors API
 *   onBook  — callback(doctor) to open the booking modal
 */
const DoctorCard = memo(function DoctorCard({ doctor, onBook }) {
  const [liked, setLiked] = useState(false);
  const { t } = useLanguage();

  const getConsultTypeLabel = (type) => {
    if (type === "Video") return t("doctorCard.video", "Video");
    if (type === "In-Clinic" || type === "In-clinic") return t("doctorCard.inClinic", "In-Clinic");
    return type;
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-500 overflow-hidden group cursor-default relative"
    >
      {/* Top gradient accent strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* ── Card Header ── */}
      <div className="relative p-5 pb-0">

        {/* Badge */}
        {doctor.badge && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="absolute top-4 right-4 flex items-center gap-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm"
          >
            <Award size={11} />
            {doctor.badge}
          </motion.div>
        )}

        {/* Favourite toggle */}
        <motion.button
          onClick={() => setLiked(!liked)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          aria-label={liked ? "Remove from favourites" : "Add to favourites"}
          className="absolute top-12 right-4 p-2 rounded-full hover:bg-red-50 transition-colors"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={liked ? "liked" : "unliked"}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Heart
                size={16}
                className={liked ? "fill-red-500 text-red-500" : "text-slate-300"}
              />
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Avatar + info */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={doctor.image || doctor.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.name || "Doctor")}`}
              alt={doctor.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-green-100 shadow-md"
              loading="lazy"
            />
            {doctor.available && (
              <motion.span
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-12">
            <h3 className="text-[15px] font-extrabold text-slate-900 truncate">{doctor.name}</h3>
            <p className="text-sm bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent font-bold">
              {doctor.specialty}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{doctor.hospital}</p>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100/80" />
      </div>

      {/* ── Meta Grid ── */}
      <div className="px-5 py-4 grid grid-cols-3 gap-2 text-center">
        <div className="bg-amber-50/60 rounded-2xl py-2.5 px-1">
          <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            {doctor.rating}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {doctor.reviews} {t("doctorCard.reviews", "reviews")}
          </div>
        </div>
        <div className="bg-blue-50/60 rounded-2xl py-2.5 px-1">
          <div className="text-sm font-bold text-slate-900">
            {doctor.experience} {t("doctorCard.yrs", "yrs")}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {t("doctorCard.experience", "Experience")}
          </div>
        </div>
        <div className="bg-green-50/60 rounded-2xl py-2.5 px-1">
          <div className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            ₹{doctor.fee}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {t("doctorCard.consultFee", "Consult fee")}
          </div>
        </div>
      </div>

      {/* ── Availability + CTA ── */}
      <div className="px-5 pb-5 space-y-3">
        <div className="flex items-center gap-1.5 text-xs">
          <Clock
            size={13}
            className={doctor.available ? "text-green-500" : "text-slate-400"}
          />
          <span className={`font-semibold ${doctor.available ? "text-green-600" : "text-slate-500"}`}>
            {doctor.available ? t("doctorCard.available", "Available:") : t("doctorCard.next", "Next:")}
          </span>
          <span className="text-slate-600">{doctor.nextSlot}</span>
        </div>

        {/* Consult type pills */}
        <div className="flex gap-1.5 flex-wrap">
          {(doctor.consultType || []).map((type) => (
            <span
              key={type}
              className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${
                type === "Video"
                  ? "bg-cyan-50 text-cyan-600 border-cyan-100"
                  : "bg-green-50 text-green-600 border-green-100"
              }`}
            >
              {type === "Video" ? "📹 " : "🏥 "}
              {getConsultTypeLabel(type)}
            </span>
          ))}
        </div>

        <motion.button
          onClick={() => onBook(doctor)}
          whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(16,185,129,0.35)" }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-sm font-bold py-3 rounded-2xl transition-all shadow-md shadow-green-200"
        >
          <Calendar size={15} />
          {t("doctorCard.bookAppointment", "Book Appointment")}
        </motion.button>
      </div>
    </motion.article>
  );
});

export default DoctorCard;
