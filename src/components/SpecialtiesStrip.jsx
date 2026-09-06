import { motion } from "framer-motion";
import { Activity, Brain, Heart, Stethoscope, User, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

const SPECIALTIES = [
  {
    key: "Cardiology",
    Icon: Heart,
    gradient: "from-rose-500 to-pink-500",
    glow: "shadow-rose-200",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    key: "Neurology",
    Icon: Brain,
    gradient: "from-violet-500 to-purple-500",
    glow: "shadow-violet-200",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    key: "Orthopedics",
    Icon: Activity,
    gradient: "from-orange-500 to-amber-500",
    glow: "shadow-orange-200",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  {
    key: "Pediatrics",
    Icon: User,
    gradient: "from-pink-500 to-rose-400",
    glow: "shadow-pink-200",
    bg: "bg-pink-50",
    border: "border-pink-100",
  },
  {
    key: "Ophthalmology",
    Icon: Zap,
    gradient: "from-green-500 to-emerald-500",
    glow: "shadow-green-200",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  {
    key: "General",
    Icon: Stethoscope,
    gradient: "from-teal-500 to-cyan-500",
    glow: "shadow-teal-200",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function SpecialtiesStrip() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSpecialtyClick = (specialtyKey) => {
    navigate(`/?q=${specialtyKey}`, { replace: true });
    setTimeout(() => {
      document.getElementById("doctors-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full shadow-sm">
            {t("specialties.badge", "Our Specialties")}
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-5 tracking-tight">
            {t("specialties.title", "Browse by Specialty")}
          </h2>
          <p className="text-slate-500 text-base mt-2">
            {t("specialties.subtitle", "Find specialists across 30+ medical fields")}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-3 sm:grid-cols-6 gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {SPECIALTIES.map(({ key, Icon, gradient, glow, bg, border }) => (
            <motion.button
              key={key}
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSpecialtyClick(key)}
              className={`group flex flex-col items-center gap-3 p-5 rounded-3xl ${bg} border ${border} backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${glow}`}
            >
              <motion.div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow} group-hover:scale-110 transition-transform duration-500`}
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Icon size={26} className="text-white" />
              </motion.div>
              <span className="text-xs font-bold text-slate-700 text-center leading-tight">
                {t(`specialties.${key}`, key)}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
