/**
 * specialties.js
 * Specialties, platform stats, and "How It Works" copy — extracted from MediPulse.jsx
 * Icon names are stored as strings (Lucide icon names) for serialisation over the API.
 */

const SPECIALTIES = [
  { name: "Cardiology",    icon: "Heart",       bg: "bg-red-50",      text: "text-red-500"    },
  { name: "Neurology",     icon: "Brain",       bg: "bg-emerald-50",  text: "text-purple-500" },
  { name: "Orthopedics",   icon: "Activity",    bg: "bg-orange-50",   text: "text-orange-500" },
  { name: "Pediatrics",    icon: "User",        bg: "bg-pink-50",     text: "text-pink-500"   },
  { name: "Ophthalmology", icon: "Zap",         bg: "bg-green-50",    text: "text-green-500"  },
  { name: "General",       icon: "Stethoscope", bg: "bg-emerald-50",  text: "text-emerald-500"},
];

const STATS = [
  { value: "500+", label: "Verified Doctors",  icon: "BadgeCheck" },
  { value: "50K+", label: "Happy Patients",    icon: "Heart"      },
  { value: "4.9★", label: "Average Rating",    icon: "Star"       },
  { value: "24/7", label: "Support Available", icon: "Activity"   },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Search a Doctor",
    desc: "Find doctors by specialty, name, location, or symptoms using our intelligent search.",
    icon: "Search",
    gradient: "from-green-500 to-green-700",
  },
  {
    step: "02",
    title: "Book a Slot",
    desc: "Choose a date and time that works for you. Real-time availability — no waiting on hold.",
    icon: "Calendar",
    gradient: "from-emerald-400 to-emerald-600",
  },
  {
    step: "03",
    title: "Consult & Heal",
    desc: "Visit in-clinic or join a secure video consultation from the comfort of your home.",
    icon: "Video",
    gradient: "from-green-400 to-green-600",
  },
];

module.exports = { SPECIALTIES, STATS, HOW_IT_WORKS };
