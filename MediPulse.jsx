/**
 * MediPulse — AI-Powered Doctor Appointment Booking Platform
 * Single-file React component for Vite + Tailwind CSS v3
 *
 * Dependencies:
 *   npm install lucide-react
 *   Tailwind CSS v3 configured in your project
 *
 * Usage: Replace src/App.jsx with this file, or import as a component.
 */

import { useState } from "react";
import {
  Search, MapPin, Star, Clock, X, Calendar, Shield,
  Brain, Stethoscope, Heart, Activity, CheckCircle,
  ArrowRight, Menu, Bell, User, Zap, MessageSquare,
  Award, ChevronLeft, Video, Phone, Mail,
  Twitter, Facebook, Instagram, Linkedin, Youtube,
  Sparkles, HeartPulse, BadgeCheck, Filter,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const SPECIALTIES = [
  { name: "Cardiology",     icon: Heart,        bg: "bg-red-50",    text: "text-red-500"    },
  { name: "Neurology",      icon: Brain,        bg: "bg-emerald-50", text: "text-purple-500" },
  { name: "Orthopedics",    icon: Activity,     bg: "bg-orange-50", text: "text-orange-500" },
  { name: "Pediatrics",     icon: User,         bg: "bg-pink-50",   text: "text-pink-500"   },
  { name: "Ophthalmology",  icon: Zap,          bg: "bg-green-50",   text: "text-green-500"   },
  { name: "General",        icon: Stethoscope,  bg: "bg-emerald-50",   text: "text-emerald-500"   },
];

const DOCTORS = [
  {
    id: 1,
    name: "Dr. Priya Sharma",
    specialty: "Cardiologist",
    hospital: "Apollo Hospital, Mumbai",
    rating: 4.9,
    reviews: 312,
    experience: 12,
    fee: 800,
    available: true,
    nextSlot: "Today, 3:00 PM",
    image: "https://i.pravatar.cc/150?img=47",
    badge: "Top Rated",
    consultType: ["In-clinic", "Video"],
  },
  {
    id: 2,
    name: "Dr. Arjun Mehta",
    specialty: "Neurologist",
    hospital: "Fortis Hospital, Delhi",
    rating: 4.8,
    reviews: 245,
    experience: 15,
    fee: 1200,
    available: true,
    nextSlot: "Today, 5:30 PM",
    image: "https://i.pravatar.cc/150?img=68",
    badge: "Expert",
    consultType: ["In-clinic", "Video"],
  },
  {
    id: 3,
    name: "Dr. Sneha Kulkarni",
    specialty: "Pediatrician",
    hospital: "Rainbow Hospital, Pune",
    rating: 4.9,
    reviews: 189,
    experience: 8,
    fee: 600,
    available: true,
    nextSlot: "Tomorrow, 10:00 AM",
    image: "https://i.pravatar.cc/150?img=45",
    badge: "Top Rated",
    consultType: ["In-clinic"],
  },
  {
    id: 4,
    name: "Dr. Rahul Nair",
    specialty: "Orthopedic Surgeon",
    hospital: "Medanta, Gurgaon",
    rating: 4.7,
    reviews: 421,
    experience: 20,
    fee: 1500,
    available: false,
    nextSlot: "Thu, 11:00 AM",
    image: "https://i.pravatar.cc/150?img=52",
    badge: "Senior Consultant",
    consultType: ["In-clinic"],
  },
  {
    id: 5,
    name: "Dr. Ananya Bose",
    specialty: "Dermatologist",
    hospital: "Skin Care Clinic, Kolkata",
    rating: 4.8,
    reviews: 156,
    experience: 9,
    fee: 700,
    available: true,
    nextSlot: "Today, 6:00 PM",
    image: "https://i.pravatar.cc/150?img=44",
    badge: "Expert",
    consultType: ["In-clinic", "Video"],
  },
  {
    id: 6,
    name: "Dr. Vikram Reddy",
    specialty: "Ophthalmologist",
    hospital: "Sankara Eye Hospital, Hyderabad",
    rating: 4.9,
    reviews: 298,
    experience: 14,
    fee: 900,
    available: true,
    nextSlot: "Tomorrow, 9:30 AM",
    image: "https://i.pravatar.cc/150?img=65",
    badge: "Top Rated",
    consultType: ["In-clinic", "Video"],
  },
];

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM",
];

const BOOKED_SLOTS = ["10:00 AM", "03:00 PM", "05:30 PM"];

const STATS = [
  { value: "500+",  label: "Verified Doctors",  icon: BadgeCheck },
  { value: "50K+",  label: "Happy Patients",    icon: Heart      },
  { value: "4.9★",  label: "Average Rating",    icon: Star       },
  { value: "24/7",  label: "Support Available", icon: Activity   },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Search a Doctor",
    desc: "Find doctors by specialty, name, location, or symptoms using our intelligent search.",
    icon: Search,
    gradient: "from-green-500 to-green-700",
  },
  {
    step: "02",
    title: "Book a Slot",
    desc: "Choose a date and time that works for you. Real-time availability — no waiting on hold.",
    icon: Calendar,
    gradient: "from-emerald-400 to-emerald-600",
  },
  {
    step: "03",
    title: "Consult & Heal",
    desc: "Visit in-clinic or join a secure video consultation from the comfort of your home.",
    icon: Video,
    gradient: "from-green-400 to-green-600",
  },
];

const BOOKING_STEPS = ["Select Date", "Choose Time", "Your Info", "Confirm"];

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <div className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-md shadow-green-200">
              <HeartPulse size={17} className="text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Medi<span className="text-green-600">Pulse</span>
            </span>
          </div>

          {/* ── Desktop Links ── */}
          <div className="hidden md:flex items-center gap-7">
            {["Home", "Find Doctors", "Services", "About Us"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm font-medium text-slate-500 hover:text-green-600 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* ── Desktop Actions ── */}
          <div className="hidden md:flex items-center gap-2">
            <button className="relative p-2 text-slate-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50">
              <Bell size={19} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
            <button className="text-sm font-semibold text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl transition-colors">
              Log In
            </button>
            <button className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-5 py-2 rounded-xl shadow-sm shadow-green-300 transition-colors">
              Sign Up Free
            </button>
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* ── Mobile Drawer ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-1 animate-in">
            {["Home", "Find Doctors", "Services", "About Us"].map((link) => (
              <a
                key={link}
                href="#"
                className="block px-2 py-2.5 text-sm font-medium text-slate-600 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                {link}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <button className="w-full text-sm font-semibold text-green-600 py-2.5 rounded-xl border border-green-200 hover:bg-green-50 transition-colors">
                Log In
              </button>
              <button className="w-full text-sm font-semibold text-white bg-green-600 py-2.5 rounded-xl hover:bg-green-700 transition-colors">
                Sign Up Free
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  const [query, setQuery]           = useState("");
  const [location, setLocation]     = useState("");
  const [consultType, setType]      = useState("All");

  return (
    <section className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 overflow-hidden">

      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-green-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center max-w-4xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-7">
            <Sparkles size={13} className="text-green-300" />
            <span className="text-sm font-medium text-white/90">AI-Powered Healthcare Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-extrabold text-white leading-[1.12] mb-5 tracking-tight">
            Find &amp; Book the{" "}
            <span className="relative inline-block">
              <span className="text-green-300">Best Doctors</span>
              {/* Underline squiggle */}
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 320 10"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 7 Q80 1 160 7 Q240 13 318 7"
                  stroke="#6EE7B7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            Near You
          </h1>

          <p className="text-base sm:text-lg text-green-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connecting patients with trusted healthcare professionals. Book same-day appointments,
            consult online, and manage your health — all in one place.
          </p>

          {/* ── Search Bar ── */}
          <div className="bg-white rounded-2xl shadow-2xl shadow-green-900/20 p-2 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">

              {/* Doctor / Specialty */}
              <label className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl focus-within:ring-2 focus-within:ring-green-200 transition-all cursor-text">
                <Search size={17} className="text-green-500 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Doctor name or specialty…"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                />
              </label>

              {/* Location */}
              <label className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl focus-within:ring-2 focus-within:ring-emerald-200 transition-all cursor-text">
                <MapPin size={17} className="text-emerald-500 shrink-0" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City or hospital…"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                />
              </label>

              {/* Consult Type */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl sm:w-44">
                <Video size={17} className="text-emerald-400 shrink-0" />
                <select
                  value={consultType}
                  onChange={(e) => setType(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-600 outline-none cursor-pointer"
                >
                  <option>All</option>
                  <option>In-Clinic</option>
                  <option>Video</option>
                </select>
              </div>

              {/* Search CTA */}
              <button className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-green-300/40">
                <Search size={17} />
                Search
              </button>
            </div>

            {/* Quick Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-3 px-1 pb-1">
              <span className="text-xs text-slate-400 font-medium">Quick:</span>
              {["Cardiologist", "Dermatologist", "Neurologist", "Pediatrician"].map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats Strip ── */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center"
            >
              <Icon size={20} className="text-green-300 mx-auto mb-2" />
              <div className="text-2xl font-extrabold text-white">{value}</div>
              <div className="text-xs text-green-100 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALTIES STRIP
// ─────────────────────────────────────────────────────────────────────────────

function SpecialtiesStrip() {
  return (
    <section className="py-14 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Browse by Specialty</h2>
          <p className="text-slate-500 text-sm mt-1">Find specialists across 30+ medical fields</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {SPECIALTIES.map(({ name, icon: Icon, bg, text }) => (
            <button
              key={name}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl ${bg} hover:scale-105 active:scale-95 transition-transform`}
            >
              <div className={`w-12 h-12 rounded-xl ${bg} border border-white/60 flex items-center justify-center shadow-sm`}>
                <Icon size={22} className={text} />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center leading-tight">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR CARD
// ─────────────────────────────────────────────────────────────────────────────

function DoctorCard({ doctor, onBook }) {
  const [liked, setLiked] = useState(false);

  return (
    <article className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">

      {/* ── Card Header ── */}
      <div className="relative p-5 pb-0">

        {/* Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-600 text-[11px] font-bold px-2.5 py-1 rounded-full">
          <Award size={11} />
          {doctor.badge}
        </div>

        {/* Favourite toggle */}
        <button
          onClick={() => setLiked(!liked)}
          aria-label={liked ? "Remove from favourites" : "Add to favourites"}
          className="absolute top-12 right-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <Heart
            size={15}
            className={liked ? "fill-red-500 text-red-500" : "text-slate-300"}
          />
        </button>

        {/* Avatar + info */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-100"
            />
            {doctor.available && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-12">
            <h3 className="text-[15px] font-extrabold text-slate-900 truncate">{doctor.name}</h3>
            <p className="text-sm text-green-600 font-semibold">{doctor.specialty}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{doctor.hospital}</p>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100" />
      </div>

      {/* ── Meta Grid ── */}
      <div className="px-5 py-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            {doctor.rating}
          </div>
          <div className="text-[11px] text-slate-400">{doctor.reviews} reviews</div>
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">{doctor.experience} yrs</div>
          <div className="text-[11px] text-slate-400">Experience</div>
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">₹{doctor.fee}</div>
          <div className="text-[11px] text-slate-400">Consult fee</div>
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
            {doctor.available ? "Available:" : "Next:"}
          </span>
          <span className="text-slate-600">{doctor.nextSlot}</span>
        </div>

        {/* Consult type pills */}
        <div className="flex gap-1.5 flex-wrap">
          {doctor.consultType.map((t) => (
            <span
              key={t}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                t === "Video"
                  ? "bg-green-50 text-cyan-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              {t === "Video" ? "📹" : "🏥"} {t}
            </span>
          ))}
        </div>

        <button
          onClick={() => onBook(doctor)}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-bold py-2.5 rounded-xl transition-colors shadow-sm shadow-green-200 group-hover:shadow-green-300"
        >
          <Calendar size={15} />
          Book Appointment
        </button>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING MODAL
// ─────────────────────────────────────────────────────────────────────────────

function BookingModal({ doctor, onClose }) {
  const [step, setStep]               = useState(1);
  const [selectedDate, setDate]       = useState(null);
  const [selectedSlot, setSlot]       = useState(null);
  const [form, setForm]               = useState({ name: "", phone: "", email: "", reason: "" });
  const [confirmed, setConfirmed]     = useState(false);

  // Generate next 14 days from today
  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const fmtDate = (d) =>
    d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });

  const canContinue =
    (step === 1 && selectedDate) ||
    (step === 2 && selectedSlot) ||
    (step === 3 && form.name.trim() !== "" && form.phone.trim() !== "" && form.email.trim() !== "") ||
    step === 4;

  const handleFormChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // ── Confirmed State ──────────────────────────────────
  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={42} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Booking Confirmed!</h2>
          <p className="text-slate-500 text-sm mb-1">
            Your appointment with <strong className="text-slate-800">{doctor.name}</strong> is booked.
          </p>
          <p className="text-green-600 font-bold text-base mt-1 mb-5">
            {selectedDate && fmtDate(selectedDate)} · {selectedSlot}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed mb-8">
            A confirmation has been sent to{" "}
            <span className="font-semibold text-slate-600">{form.email || "your email"}</span>.
            You'll receive a reminder 30 minutes before the consultation.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg">
              Pay ₹{doctor.fee} via Razorpay
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col max-h-[92vh]">

        {/* ── Modal Header ── */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 pt-6 pb-7 shrink-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white">Book Appointment</h2>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>

          {/* Doctor mini-card */}
          <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl p-3 mb-5">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-12 h-12 rounded-xl object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">{doctor.name}</div>
              <div className="text-xs text-green-100">{doctor.specialty} · ₹{doctor.fee} consult</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5">
            {BOOKING_STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i + 1 <= step ? "bg-white" : "bg-white/30"
                  }`}
                />
                <div className={`text-[10px] mt-1 font-medium text-center ${
                  i + 1 <= step ? "text-white" : "text-white/40"
                }`}>
                  {s}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Modal Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Step 1 — Date picker */}
          {step === 1 && (
            <div>
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 mb-4">
                <Calendar size={18} className="text-green-600" />
                Select a Date
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {dates.map((d, i) => {
                  const isSel = selectedDate?.toDateString() === d.toDateString();
                  return (
                    <button
                      key={i}
                      onClick={() => setDate(d)}
                      className={`flex flex-col items-center py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                        isSel
                          ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100"
                          : "border-slate-200 text-slate-700 hover:border-green-300 hover:bg-green-50"
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase ${isSel ? "text-green-200" : "text-slate-400"}`}>
                        {d.toLocaleDateString("en-IN", { weekday: "short" })}
                        {i === 0 && (
                          <span className={`ml-1 ${isSel ? "text-green-300" : "text-green-400"}`}>•</span>
                        )}
                      </span>
                      <span className="text-lg font-extrabold mt-0.5">{d.getDate()}</span>
                      <span className={`text-[10px] ${isSel ? "text-green-200" : "text-slate-400"}`}>
                        {d.toLocaleDateString("en-IN", { month: "short" })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2 — Time slot picker */}
          {step === 2 && (
            <div>
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 mb-1">
                <Clock size={18} className="text-green-600" />
                Choose a Time Slot
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {selectedDate && fmtDate(selectedDate)} · All times in IST
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isBooked = BOOKED_SLOTS.includes(slot);
                  const isSel = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      disabled={isBooked}
                      onClick={() => setSlot(slot)}
                      className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                        isBooked
                          ? "bg-slate-50 border-slate-100 text-slate-300 line-through cursor-not-allowed"
                          : isSel
                          ? "bg-green-600 border-green-600 text-white shadow-md shadow-green-100"
                          : "border-slate-200 text-slate-700 hover:border-green-300 hover:bg-green-50"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-4 text-xs text-slate-400">
                {[
                  { swatch: "bg-green-600", label: "Selected" },
                  { swatch: "bg-slate-200", label: "Booked" },
                  { swatch: "border border-slate-200", label: "Available" },
                ].map(({ swatch, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded ${swatch} inline-block`} />
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
                <User size={18} className="text-green-600" />
                Your Information
              </h3>
              <div className="space-y-4">
                {[
                  { key: "name",  label: "Full Name",     placeholder: "Dhrubangshu Das",    icon: User,  type: "text"  },
                  { key: "phone", label: "Phone Number",  placeholder: "+91 98765 43210",    icon: Phone, type: "tel"   },
                  { key: "email", label: "Email Address", placeholder: "you@example.com",    icon: Mail,  type: "email" },
                ].map(({ key, label, placeholder, icon: Icon, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
                    <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
                      <Icon size={15} className="text-slate-400 shrink-0" />
                      <input
                        type={type}
                        value={form[key]}
                        onChange={(e) => handleFormChange(key, e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 text-sm text-slate-800 outline-none bg-transparent placeholder-slate-300"
                      />
                    </div>
                  </div>
                ))}

                {/* Reason textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Reason for Visit{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.reason}
                    onChange={(e) => handleFormChange("reason", e.target.value)}
                    placeholder="Briefly describe your symptoms or concerns…"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Confirm */}
          {step === 4 && (
            <div>
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 mb-5">
                <CheckCircle size={18} className="text-green-600" />
                Review &amp; Confirm
              </h3>

              <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                {[
                  { label: "Doctor",           value: doctor.name                               },
                  { label: "Specialty",        value: doctor.specialty                          },
                  { label: "Hospital",         value: doctor.hospital                           },
                  { label: "Date",             value: selectedDate ? fmtDate(selectedDate) : "—" },
                  { label: "Time",             value: selectedSlot || "—"                       },
                  { label: "Patient",          value: form.name  || "—"                         },
                  { label: "Contact",          value: form.phone || "—"                         },
                  { label: "Consultation Fee", value: `₹${doctor.fee}`, highlight: true         },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className={`font-semibold ${highlight ? "text-green-600 text-base" : "text-slate-900"}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs text-slate-400">
                <Shield size={13} className="text-green-500 mt-0.5 shrink-0" />
                <span>
                  Your data is encrypted end-to-end. Payment is processed securely via{" "}
                  <span className="text-green-500 font-medium">Razorpay</span>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-slate-100 shrink-0">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-5 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canContinue}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl transition-colors"
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => setConfirmed(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:opacity-90 text-white text-sm font-bold py-3 rounded-xl transition-opacity shadow-lg shadow-green-200"
            >
              Confirm &amp; Pay ₹{doctor.fee} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-full">
            Simple Process
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-4">
            Book a Doctor in 3 Easy Steps
          </h2>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
            No phone calls, no waiting rooms. Healthcare made effortlessly simple.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop only) */}
          <div
            className="hidden md:block absolute top-14 left-[calc(33%+2rem)] right-[calc(33%+2rem)] h-px bg-gradient-to-r from-blue-300 via-teal-300 to-cyan-300"
            aria-hidden="true"
          />

          {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon, gradient }) => (
            <div key={step} className="relative flex flex-col items-center text-center z-10">
              <div
                className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xl mb-5`}
              >
                <Icon size={36} className="text-white" />
              </div>
              <div className="text-xs font-extrabold text-slate-400 tracking-widest mb-2">
                STEP {step}
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI FEATURES
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTIONS = ["Chest pain and shortness of breath", "Persistent headache", "Skin rash and itching"];

function AIFeatures() {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hi! Describe your symptoms and I'll suggest relevant specialists and possible conditions in seconds.",
    },
  ]);
  const [input, setInput] = useState("");

  const SPECIALIST_POOL = ["Cardiologist", "Neurologist", "Dermatologist", "Pulmonologist", "Gastroenterologist"];

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const specialist = SPECIALIST_POOL[Math.floor(Math.random() * SPECIALIST_POOL.length)];
    setMessages((prev) => [
      ...prev,
      { from: "user", text },
      {
        from: "ai",
        text: `Based on your symptoms, I recommend consulting a **${specialist}**. I've found 8 highly rated doctors available this week. Shall I show you the best matches?`,
      },
    ]);
    setInput("");
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full">
            AI-Powered
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-4">
            Smarter Healthcare Starts Here
          </h2>
          <p className="text-slate-500 mt-2 max-w-lg mx-auto text-sm">
            Our AI features work together to connect you with the right care, faster.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── Interactive Symptom Checker ── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-green-500 to-emerald-700 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Brain size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-white">AI Symptom Checker</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-200">Online · Powered by GPT-4</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex flex-col h-72">
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.from === "ai" && (
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-auto shrink-0">
                        <Sparkles size={13} className="text-emerald-700" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] text-sm rounded-2xl px-4 py-2.5 leading-relaxed ${
                        msg.from === "user"
                          ? "bg-green-600 text-white rounded-br-sm"
                          : "bg-slate-100 text-slate-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick suggestions */}
              <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-green-100 px-3 py-1 rounded-full whitespace-nowrap transition-colors shrink-0"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-slate-100 p-3 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Describe your symptoms…"
                  className="flex-1 text-sm bg-slate-50 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-200 placeholder-slate-300 transition-all"
                />
                <button
                  onClick={() => sendMessage(input)}
                  className="bg-green-700 hover:bg-green-800 text-white p-2.5 rounded-xl transition-colors"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="flex flex-col gap-5">

            {/* Smart Matching */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex">
              <div className="w-1.5 bg-gradient-to-b from-green-500 to-emerald-400 shrink-0" />
              <div className="flex-1 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shrink-0">
                    <Zap size={22} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                      <h3 className="text-[15px] font-bold text-slate-900">Smart Doctor Matching</h3>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        98% Accuracy
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">
                      Our engine analyses 40+ parameters — specialty, location, availability, 
                      and patient reviews — to surface your ideal doctor instantly.
                    </p>
                    <button className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1 group">
                      Find My Doctor{" "}
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Health Assistant */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex">
              <div className="w-1.5 bg-gradient-to-b from-emerald-500 to-green-500 shrink-0" />
              <div className="flex-1 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shrink-0">
                    <MessageSquare size={22} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                      <h3 className="text-[15px] font-bold text-slate-900">AI Health Assistant</h3>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Available 24/7
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">
                      Get instant answers to health questions, medication reminders, and 
                      personalised health tips from your always-on AI companion.
                    </p>
                    <button className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1 group">
                      Start Chat{" "}
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust / Security Card */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Shield size={22} className="text-green-300" />
                <h3 className="font-extrabold text-base">HIPAA Compliant &amp; Secure</h3>
              </div>
              <p className="text-sm text-green-100 mb-5 leading-relaxed">
                All health data is encrypted end-to-end. We never share your information 
                without your explicit consent.
              </p>
              <div className="flex gap-2 flex-wrap">
                {["ISO 27001", "HIPAA", "256-bit SSL", "SOC 2"].map((badge) => (
                  <span
                    key={badge}
                    className="text-xs font-bold text-white bg-white/20 border border-white/30 px-3 py-1 rounded-full"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

const FOOTER_LINKS = [
  {
    title: "Company",
    links: ["About Us", "Careers", "Blog", "Press", "Partners"],
  },
  {
    title: "For Patients",
    links: ["Find Doctors", "Book Appointment", "Video Consult", "Lab Tests", "Health Records"],
  },
  {
    title: "Support",
    links: ["Help Center", "Contact Us", "Privacy Policy", "Terms of Use", "Cookie Policy"],
  },
];

const SOCIAL_ICONS = [Twitter, Facebook, Instagram, Linkedin, Youtube];

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-md shadow-green-900/35">
                <HeartPulse size={17} className="text-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Medi<span className="text-green-400">Pulse</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              Connecting patients with trusted healthcare professionals. Book appointments, 
              consult online, and manage your health — all in one place.
            </p>
            <div className="flex gap-2">
              {SOCIAL_ICONS.map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 bg-slate-800 hover:bg-green-600 rounded-xl flex items-center justify-center transition-colors"
                  aria-label="Social link"
                >
                  <Icon size={15} className="text-slate-300" />
                </button>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {FOOTER_LINKS.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-sm font-extrabold text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2025 MediPulse Health Tech Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <Shield size={13} className="text-green-500" />
            <span>256-bit SSL Secured · HIPAA Compliant · SOC 2 Certified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────

export default function MediPulse() {
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [activeFilter, setActiveFilter]   = useState("All");

  const FILTER_OPTIONS = ["All", "Cardiologist", "Neurologist", "Pediatrician", "Dermatologist"];

  const visibleDoctors =
    activeFilter === "All"
      ? DOCTORS
      : DOCTORS.filter((d) =>
          d.specialty.toLowerCase().includes(activeFilter.toLowerCase())
        );

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <Navbar />
      <Hero />
      <SpecialtiesStrip />

      {/* ── Doctors Section ── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full">
                Our Network
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-3">Top-Rated Doctors</h2>
              <p className="text-slate-500 mt-1 text-sm">
                Verified specialists. Real patient reviews.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={15} className="text-slate-400 shrink-0" />
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
                    activeFilter === f
                      ? "bg-green-600 border-green-600 text-white shadow-sm shadow-green-200"
                      : "border-slate-200 bg-white text-slate-600 hover:border-green-300 hover:bg-green-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Grid */}
          {visibleDoctors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleDoctors.map((doc) => (
                <DoctorCard key={doc.id} doctor={doc} onBook={setBookingDoctor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <Stethoscope size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No doctors found for this specialty.</p>
              <button
                onClick={() => setActiveFilter("All")}
                className="mt-3 text-sm text-green-600 hover:underline"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* View All CTA */}
          <div className="text-center mt-12">
            <button className="inline-flex items-center gap-2 text-sm font-bold text-green-600 border border-green-200 bg-white hover:bg-green-50 px-8 py-3 rounded-xl transition-colors shadow-sm">
              View All 500+ Doctors <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <HowItWorks />
      <AIFeatures />
      <Footer />

      {/* ── Booking Modal ── */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
        />
      )}
    </div>
  );
}
