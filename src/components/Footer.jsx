import { motion } from "framer-motion";
import {
  Facebook, HeartPulse, Instagram, Linkedin, Shield,
  Twitter, Youtube, Mail, ArrowRight, MapPin, Phone,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const SOCIALS = [
  { Icon: Twitter,   label: "Twitter",   href: "#" },
  { Icon: Facebook,  label: "Facebook",  href: "#" },
  { Icon: Instagram, label: "Instagram", href: "#" },
  { Icon: Linkedin,  label: "LinkedIn",  href: "#" },
  { Icon: Youtube,   label: "YouTube",   href: "#" },
];

const CERTIFICATIONS = ["ISO 27001", "HIPAA", "256-bit SSL", "SOC 2"];

export default function Footer() {
  const { t } = useLanguage();

  const FOOTER_LINKS = [
    {
      title: t("footer.company", "Company"),
      links: [
        { label: t("footer.aboutUs", "About Us"), href: "#" },
        { label: t("footer.careers", "Careers"), href: "#" },
        { label: t("footer.blog", "Blog"), href: "#" },
        { label: t("footer.press", "Press"), href: "#" },
        { label: t("footer.partners", "Partners"), href: "#" },
      ],
    },
    {
      title: t("footer.forPatients", "For Patients"),
      links: [
        { label: t("footer.findDoctors", "Find Doctors"), href: "/#doctors-section" },
        { label: t("footer.bookAppointment", "Book Appointment"), href: "/#doctors-section" },
        { label: t("footer.videoConsult", "Video Consult"), href: "/#doctors-section" },
        { label: t("footer.labTests", "Lab Tests"), href: "#" },
        { label: t("footer.healthRecords", "Health Records"), href: "/patient/dashboard" },
      ],
    },
    {
      title: t("footer.support", "Support"),
      links: [
        { label: t("footer.helpCenter", "Help Center"), href: "#" },
        { label: t("footer.contactUs", "Contact Us"), href: "#" },
        { label: t("footer.privacyPolicy", "Privacy Policy"), href: "#" },
        { label: t("footer.termsOfUse", "Terms of Use"), href: "#" },
        { label: t("footer.cookiePolicy", "Cookie Policy"), href: "#" },
      ],
    },
  ];

  return (
    <footer className="relative bg-[radial-gradient(ellipse_at_bottom_left,_#022c22_0%,_#0f172a_50%,_#0f172a_100%)] text-slate-400 overflow-hidden">
      {/* Subtle mesh blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-green-900/30 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-900/20 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Newsletter strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="border-b border-white/8 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
        >
          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight mb-1">
              {t("footer.stayAhead", "Stay ahead of your health")}
            </h3>
            <p className="text-sm text-slate-400 max-w-sm">
              {t("footer.newsletterDesc", "Get weekly health tips, new doctor alerts, and wellness insights delivered to your inbox.")}
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <label className="flex-1 md:w-72 flex items-center gap-2 bg-white/8 border border-white/12 rounded-2xl px-4 py-3 focus-within:border-emerald-500/60 transition-colors">
              <Mail size={15} className="text-slate-500 shrink-0" />
              <input
                type="email"
                placeholder={t("footer.emailPlaceholder", "Enter your email")}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
            </label>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 8px 20px rgba(16,185,129,0.35)" }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-lg shadow-green-900/40 whitespace-nowrap"
            >
              {t("footer.subscribe", "Subscribe")} <ArrowRight size={15} />
            </motion.button>
          </div>
        </motion.div>

        {/* ── Main grid ── */}
        <div className="py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-2.5 mb-5 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-900/40">
                <HeartPulse size={18} className="text-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Medi<span className="text-green-400">Pulse</span>
              </span>
            </div>

            <p className="text-sm leading-relaxed mb-6 max-w-xs text-slate-400">
              {t("footer.brandDesc", "Connecting patients with trusted healthcare professionals across India. Book appointments, consult online, and manage your health — all in one place.")}
            </p>

            {/* Contact blurbs */}
            <div className="space-y-2 mb-7 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-emerald-500 shrink-0" />
                <span>{t("footer.hqAddress", "MediPulse HQ, Bandra Kurla Complex, Mumbai 400051")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-emerald-500 shrink-0" />
                <span>{t("footer.supportPhone", "1800-103-MEDI (6334) · 24/7 Support")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-emerald-500 shrink-0" />
                <span>support@medipulse.health</span>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex gap-2">
              {SOCIALS.map(({ Icon, label, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{ scale: 1.12, backgroundColor: "rgba(16,185,129,0.25)" }}
                  whileTap={{ scale: 0.94 }}
                  className="w-9 h-9 bg-white/8 border border-white/10 hover:border-emerald-500/40 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Icon size={15} className="text-slate-400 hover:text-emerald-400 transition-colors" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          {FOOTER_LINKS.map(({ title, links }, colIdx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (colIdx + 1) }}
              viewport={{ once: true }}
            >
              <h4 className="text-sm font-extrabold text-white mb-5 tracking-wide">{title}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm text-slate-500 hover:text-emerald-400 transition-colors relative group"
                    >
                      {label}
                      <span className="absolute -bottom-px left-0 w-0 h-px bg-emerald-400 group-hover:w-full transition-all duration-300" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <p className="text-xs text-slate-600">
            {t("footer.copyright", "© 2025 MediPulse Health Tech Pvt. Ltd. All rights reserved.")}
          </p>

          {/* Certification badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Shield size={13} className="text-emerald-500" />
            {CERTIFICATIONS.map((c) => (
              <span
                key={c}
                className="text-[10px] font-bold text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
