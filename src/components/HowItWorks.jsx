import { motion } from "framer-motion";
import { Calendar, Search, Video } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function HowItWorks() {
  const { t, lang } = useLanguage();

  const HOW_IT_WORKS = [
    {
      step: lang === "bn" ? "০১" : "01",
      title: t("howItWorks.step1Title", "Search a Doctor"),
      desc: t("howItWorks.step1Desc", "Find doctors by specialty, name, location, or symptoms using our intelligent AI search."),
      Icon: Search,
      gradient: "from-green-500 to-emerald-600",
      glow: "shadow-green-300/40",
      accentColor: "text-green-600",
      accentBg: "bg-green-50",
    },
    {
      step: lang === "bn" ? "০২" : "02",
      title: t("howItWorks.step2Title", "Book a Slot"),
      desc: t("howItWorks.step2Desc", "Choose a date and time that works for you. Real-time availability — no waiting on hold."),
      Icon: Calendar,
      gradient: "from-teal-500 to-cyan-600",
      glow: "shadow-teal-300/40",
      accentColor: "text-teal-600",
      accentBg: "bg-teal-50",
    },
    {
      step: lang === "bn" ? "০৩" : "03",
      title: t("howItWorks.step3Title", "Consult & Heal"),
      desc: t("howItWorks.step3Desc", "Visit in-clinic or join a secure HD video consultation from the comfort of your home."),
      Icon: Video,
      gradient: "from-emerald-500 to-green-600",
      glow: "shadow-emerald-300/40",
      accentColor: "text-emerald-600",
      accentBg: "bg-emerald-50",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* background decorations */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-green-100 rounded-full blur-[100px] opacity-50 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-teal-100 rounded-full blur-[100px] opacity-50 translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="text-xs font-bold text-green-700 uppercase tracking-widest bg-green-50 border border-green-100 px-4 py-2 rounded-full shadow-sm">
            {t("howItWorks.badge", "Simple Process")}
          </span>
          <h2 className="text-4xl font-extrabold text-slate-900 mt-6 tracking-tight">
            {t("howItWorks.title", "Book a Doctor in")}{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              {t("howItWorks.titleHighlight", "3 Easy Steps")}
            </span>
          </h2>
          <p className="text-slate-500 mt-3 max-w-md mx-auto text-base">
            {t("howItWorks.subtitle", "No phone calls, no waiting rooms. Healthcare made effortlessly simple.")}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Animated connector line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
            viewport={{ once: true }}
            className="hidden md:block absolute top-16 left-[calc(33%+2rem)] right-[calc(33%+2rem)] h-0.5 bg-gradient-to-r from-green-300 via-teal-300 to-cyan-300 origin-left"
            aria-hidden="true"
          />

          {HOW_IT_WORKS.map(({ step, title, desc, Icon, gradient, glow, accentColor, accentBg }) => (
            <motion.div
              key={step}
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative flex flex-col items-center text-center z-10 bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-500 group cursor-default"
            >
              {/* Gradient icon blob */}
              <motion.div
                className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl ${glow} mb-6`}
                whileHover={{ rotate: 6, scale: 1.08 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Icon size={40} className="text-white" />
              </motion.div>

              {/* Step badge */}
              <span className={`text-xs font-extrabold ${accentColor} ${accentBg} px-3 py-1 rounded-full mb-3 tracking-widest`}>
                {lang === "bn" ? `ধাপ ${step}` : `STEP ${step}`}
              </span>

              <h3 className="text-xl font-extrabold text-slate-900 mb-3">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{desc}</p>

              {/* Bottom gradient accent */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
