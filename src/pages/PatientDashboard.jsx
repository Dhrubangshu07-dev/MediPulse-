import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, Clock, HeartPulse, LogOut,
  Search, ShieldCheck, Activity, Pill, User, FileText, ChevronRight, X, AlertCircle, RefreshCw, CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { supabase } from "../lib/supabase";
import { syncBus, SYNC_EVENTS } from "../utils/syncBus";

const STATUS_BADGE = {
  CONFIRMED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  COMPLETED: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  CANCELLED: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  PENDING:   "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-800 rounded-xl ${className}`} />;
}

export default function PatientDashboard() {
  const navigate   = useNavigate();
  const { user, signOut } = useAuth();
  const { t, lang } = useLanguage();

  const TABS = [
    { id: "overview",      label: t("patient.overview", "Overview"),           Icon: Activity      },
    { id: "appointments",  label: t("patient.appointments", "Appointments"),   Icon: CalendarCheck  },
    { id: "prescriptions", label: t("patient.prescriptions", "Prescriptions"), Icon: Pill           },
    { id: "profile",       label: t("patient.profile", "My Profile"),         Icon: User           },
  ];

  const VITAL_ICON_MAP = {
    "Blood Pressure":    { Icon: HeartPulse, color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20",    labelKey: "patient.bloodPressure" },
    "Heart Rate":        { Icon: Activity,   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", labelKey: "patient.heartRate" },
    "Body Temperature":  { Icon: Activity,   color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",   labelKey: "patient.temperature" },
    "Oxygen Saturation": { Icon: Activity,   color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",    labelKey: "patient.spO2" },
  };

  const [activeTab,    setActiveTab]    = useState("overview");
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Live data state
  const [appointments,   setAppointments]   = useState([]);
  const [vitals,         setVitals]         = useState([]);
  const [prescriptions,  setPrescriptions]  = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [apptLoading,    setApptLoading]    = useState(true);
  const [vitalsLoading,  setVitalsLoading]  = useState(true);
  const [rxLoading,      setRxLoading]      = useState(true);
  const [apptError,      setApptError]      = useState(null);

  const patientEmail = user?.email || "";
  const patientName  = user?.user_metadata?.full_name  || user?.email?.split("@")[0] || "Guest";
  const patientAvatar = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(patientName)}`;

  // ── Fetch patient profile (for verification status) ──────────────────────────
  const fetchPatientProfile = async () => {
    if (!patientEmail) return;
    try {
      const res = await fetch(`/api/patients/me?email=${encodeURIComponent(patientEmail)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPatientProfile(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch patient profile:", err);
    }
  };

  // ── Fetch appointments ───────────────────────────────────────────────────────
  const fetchAppointments = async () => {
    setApptLoading(true);
    setApptError(null);
    try {
      const url = patientEmail
        ? `/api/appointments?patientEmail=${encodeURIComponent(patientEmail)}`
        : `/api/appointments`;
      const res  = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setAppointments(json.data || []);
      } else {
        setApptError(json.error || t("errors.loadAppointments", "Unable to load appointments."));
      }
    } catch {
      setApptError(t("errors.networkError", "Network error. Please check your connection."));
    } finally {
      setApptLoading(false);
    }
  };

  // ── Fetch vitals ─────────────────────────────────────────────────────────────
  const fetchVitals = async () => {
    setVitalsLoading(true);
    try {
      const res  = await fetch("/api/vitals");
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setVitals(json.data);
      } else {
        setVitals([
          { label: "Blood Pressure",    value: "120/80", unit: "mmHg", trend: "Normal" },
          { label: "Heart Rate",        value: "72",     unit: "bpm",  trend: "Optimal" },
          { label: "Body Temperature",  value: "98.6",   unit: "°F",   trend: "Normal" },
          { label: "Oxygen Saturation", value: "99",     unit: "%",    trend: "Optimal" },
        ]);
      }
    } catch {
      setVitals([
        { label: "Blood Pressure",    value: "120/80", unit: "mmHg", trend: "Normal" },
        { label: "Heart Rate",        value: "72",     unit: "bpm",  trend: "Optimal" },
        { label: "Body Temperature",  value: "98.6",   unit: "°F",   trend: "Normal" },
        { label: "Oxygen Saturation", value: "99",     unit: "%",    trend: "Optimal" },
      ]);
    } finally {
      setVitalsLoading(false);
    }
  };

  // ── Fetch prescriptions ──────────────────────────────────────────────────────
  const fetchPrescriptions = async () => {
    setRxLoading(true);
    try {
      const res  = await fetch("/api/prescriptions");
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setPrescriptions(json.data);
      } else {
        setPrescriptions([
          { id: "1", name: "Amoxicillin", dose: "500mg", frequency: "3 times daily · with meals", refillIn: "5 days" },
          { id: "2", name: "Paracetamol", dose: "650mg", frequency: "As needed for fever/pain",    refillIn: "12 days" },
        ]);
      }
    } catch {
      setPrescriptions([]);
    } finally {
      setRxLoading(false);
    }
  };

  // ── Multi-layer Live Synchronization with Admin and Doctor Panels ───────────
  useEffect(() => {
    fetchAppointments();
    fetchVitals();
    fetchPrescriptions();
    fetchPatientProfile();

    // 1. Cross-tab instant syncBus listener
    const unsubSync = syncBus.onAny((type) => {
      if (type === SYNC_EVENTS.APPOINTMENT_UPDATED || type === SYNC_EVENTS.APPOINTMENT_CREATED) {
        fetchAppointments();
      }
      if (type === SYNC_EVENTS.PATIENT_UPDATED) {
        fetchPatientProfile();
      }
      if (type === SYNC_EVENTS.PRESCRIPTION_UPDATED) {
        fetchPrescriptions();
      }
    });

    // 2. Supabase Realtime multi-table listener
    let channel = null;
    channel = supabase
      .channel(`patient:sync:${patientEmail || "guest"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "Appointment" }, () => {
        fetchAppointments();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "User" }, () => {
        fetchPatientProfile();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "Prescription" }, () => {
        fetchPrescriptions();
      })
      .subscribe();

    // 3. Resilient background heartbeat polling every 8s
    const timer = setInterval(() => {
      fetchAppointments();
    }, 8000);

    return () => {
      unsubSync();
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [patientEmail]);

  const upcomingAppts = appointments.filter(
    (a) => a.status === "CONFIRMED" || a.status === "PENDING"
  );
  const pastAppts = appointments.filter(
    (a) => a.status === "COMPLETED" || a.status === "CANCELLED"
  );
  const totalSpent = appointments
    .filter((a) => a.status === "COMPLETED")
    .reduce((sum, a) => sum + (Number(a.totalAmount) || 0), 0);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#060b14] bg-[radial-gradient(ellipse_at_top_left,_#0a1520_0%,_#060b14_55%,_#030609_100%)] font-sans text-slate-200">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#060b14]/80 backdrop-blur-2xl border-b border-white/5 px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40 border border-emerald-400/20">
              <HeartPulse size={20} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">Medi<span className="text-emerald-400">Pulse</span></span>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">
                  {t("patient.portal", "Patient Portal")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Live Sync Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400 shadow-[inset_0_-2px_4px_rgba(16,185,129,0.1)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="hidden sm:inline">{t("admin.liveSyncActive", "Live Sync Connected")}</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/")}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg"
            >
              <Search size={16} /> {t("nav.findDoctor", "Find a Doctor")}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              <LogOut size={16} /> {t("nav.logout", "Logout")}
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/40 via-slate-900/60 to-slate-900/80 border border-emerald-500/20 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl"
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-5 z-10">
            <img src={patientAvatar} alt={patientName} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-emerald-500/30 shadow-xl" />
            <div>
              <p className="text-sm text-emerald-400 font-bold uppercase tracking-widest mb-1">
                {t("patient.hello", "Hello 👋")}
              </p>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{patientName}</h1>
              <p className="text-slate-400 text-sm mt-0.5">{patientEmail}</p>
            </div>
          </div>
          <div className="flex gap-3 z-10 flex-wrap">
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
              <div className="text-2xl font-extrabold text-white">{upcomingAppts.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t("patient.upcoming", "Upcoming")}</div>
            </div>
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
              <div className="text-2xl font-extrabold text-emerald-400">{pastAppts.filter(a => a.status === "COMPLETED").length}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t("patient.completed", "Completed")}</div>
            </div>
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
              <div className="text-2xl font-extrabold text-amber-400">{prescriptions.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t("patient.activeRx", "Active Rx")}</div>
            </div>
          </div>
        </motion.div>

        {/* ── Tab Switcher ── */}
        <div className="flex gap-2 p-1.5 bg-slate-900/60 border border-slate-800 rounded-2xl w-max backdrop-blur-md shadow-xl flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <tab.Icon size={15} className={activeTab === tab.id ? "text-white" : "text-slate-500"} />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Vitals */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">
                    {t("patient.vitals", "Health Vitals")}
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {vitalsLoading
                      ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-3xl" />)
                      : vitals.map((v) => {
                          const meta = VITAL_ICON_MAP[v.label] ?? { Icon: Activity, color: "text-slate-400", bg: "bg-slate-800 border-slate-700", labelKey: null };
                          const displayLabel = meta.labelKey ? t(meta.labelKey, v.label) : v.label;
                          return (
                            <div key={v.label} className={`bg-slate-900/60 border ${meta.bg} rounded-3xl p-5 backdrop-blur-sm shadow-lg flex flex-col gap-3`}>
                              <div className={`w-11 h-11 rounded-2xl ${meta.bg} border flex items-center justify-center`}>
                                <meta.Icon size={22} className={meta.color} />
                              </div>
                              <div>
                                <div className={`text-2xl font-extrabold ${meta.color}`}>{v.value} <span className="text-sm font-medium text-slate-500">{v.unit}</span></div>
                                <div className="text-xs text-slate-400 font-medium mt-0.5">{displayLabel}</div>
                                <div className="text-xs text-emerald-400 font-bold mt-1">{v.trend}</div>
                              </div>
                            </div>
                          );
                        })
                    }
                  </div>
                </div>

                {/* Upcoming Appointments */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">
                      {t("patient.upcomingAppointments", "Upcoming Appointments")}
                    </h2>
                    <button onClick={() => setActiveTab("appointments")} className="text-sm text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                      {t("patient.viewAll", "View all →")} <ChevronRight size={16} />
                    </button>
                  </div>
                  {apptLoading ? (
                    <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
                  ) : upcomingAppts.length === 0 ? (
                    <div className="text-center py-10 bg-slate-900/60 border border-slate-800 rounded-3xl">
                      <CalendarCheck size={36} className="mx-auto mb-3 opacity-30 text-emerald-500" />
                      <p className="font-semibold text-slate-400">
                        {t("patient.noAppointments", "No upcoming appointments")}
                      </p>
                      <button onClick={() => navigate("/")} className="mt-3 text-sm text-emerald-400 font-bold hover:underline">
                        {t("doctor.bookAppointment", "Book Appointment")} →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppts.slice(0, 3).map((appt) => (
                        <div key={appt.id} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-5 shadow-lg transition-all">
                          <div className="flex items-center gap-4">
                            <img src={`https://i.pravatar.cc/150?u=${appt.doctor?.user?.name}`} alt={appt.doctor?.user?.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-700" />
                            <div>
                              <div className="font-bold text-white">{appt.doctor?.user?.name || t("doctor.doctor", "Doctor")}</div>
                              <div className="text-xs text-emerald-400 font-semibold mt-0.5">{appt.doctor?.specialization || "General"}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-200">{new Date(appt.date).toLocaleDateString(lang === "bn" ? "bn-IN" : "en-IN")}</div>
                            <div className="text-sm text-blue-400 font-bold flex items-center justify-end gap-1 mt-0.5"><Clock size={13} /> {appt.timeSlot}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center shadow-lg">
                    <div className="text-3xl font-extrabold text-white">{apptLoading ? "—" : pastAppts.filter(a => a.status === "COMPLETED").length}</div>
                    <div className="text-sm text-slate-400 mt-1">{t("admin.completedAppts", "Completed Visits")}</div>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center shadow-lg">
                    <div className="text-3xl font-extrabold text-emerald-400">{apptLoading ? "—" : `₹${totalSpent.toLocaleString()}`}</div>
                    <div className="text-sm text-slate-400 mt-1">{t("admin.totalRevenue", "Total Spent")}</div>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center shadow-lg">
                    <div className="text-3xl font-extrabold text-amber-400">{rxLoading ? "—" : prescriptions.length}</div>
                    <div className="text-sm text-slate-400 mt-1">{t("patient.activeRx", "Active Rx")}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── APPOINTMENTS ── */}
            {activeTab === "appointments" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    {t("appointment.allAppointments", "All Appointments")}
                  </h2>
                  <button onClick={fetchAppointments} className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-sm font-bold text-slate-300 hover:text-white rounded-xl hover:bg-slate-700 transition-colors">
                    <RefreshCw size={15} className="text-emerald-400" /> {t("common.refresh", "Refresh")}
                  </button>
                </div>

                {apptError && (
                  <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-2xl text-sm font-semibold">
                    <AlertCircle size={18} /> {apptError}
                  </div>
                )}

                {/* Upcoming */}
                {upcomingAppts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> {t("patient.upcoming", "Upcoming")}</h3>
                    <div className="space-y-3">
                      {upcomingAppts.map((appt) => (
                        <div key={appt.id} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 hover:border-blue-500/30 rounded-2xl p-5 shadow-lg transition-all">
                          <div className="flex items-center gap-4">
                            <img src={`https://i.pravatar.cc/150?u=${appt.doctor?.user?.name}`} alt="" className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-700" />
                            <div>
                              <div className="font-bold text-white">{appt.doctor?.user?.name || t("doctor.doctor", "Doctor")}</div>
                              <div className="text-xs text-emerald-400 font-semibold mt-0.5">{appt.doctor?.specialization || "General"}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold text-slate-200">{new Date(appt.date).toLocaleDateString(lang === "bn" ? "bn-IN" : "en-IN")}</div>
                              <div className="text-sm font-bold text-blue-400 flex items-center justify-end gap-1 mt-0.5"><Clock size={13}/> {appt.timeSlot}</div>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_BADGE[appt.status]}`}>
                              {t(`status.${appt.status}`, appt.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    {t("appointment.pastAppointments", "Past Appointments")}
                  </h3>
                  {apptLoading ? (
                    <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                  ) : pastAppts.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-slate-900/60 border border-slate-800 rounded-3xl">
                      <CalendarCheck size={36} className="mx-auto mb-3 opacity-20 text-emerald-500" />
                      <p className="font-semibold text-slate-400">
                        {t("appointment.noAppointments", "No past appointments yet.")}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                          <thead className="border-b border-slate-800 bg-slate-900/50">
                            <tr>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("doctor.doctor", "Doctor")}</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("appointment.date", "Date")}</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("appointment.status", "Status")}</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t("appointment.fee", "Fee")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {pastAppts.map((appt) => (
                              <tr key={appt.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-white">{appt.doctor?.user?.name || t("doctor.doctor", "Doctor")}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">{appt.doctor?.specialization || "General"}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-slate-300">{new Date(appt.date).toLocaleDateString(lang === "bn" ? "bn-IN" : "en-IN")}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">{appt.timeSlot}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_BADGE[appt.status]}`}>
                                    {t(`status.${appt.status}`, appt.status)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right font-extrabold text-white">₹{appt.totalAmount || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PRESCRIPTIONS ── */}
            {activeTab === "prescriptions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {t("prescription.prescriptions", "Prescriptions")}
                  </h2>
                  <span className="text-xs text-slate-400 font-medium bg-slate-800 border border-slate-700 px-3 py-1 rounded-full">
                    {prescriptions.length} {t("status.AVAILABLE", "active")}
                  </span>
                </div>
                {rxLoading
                  ? [...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-3xl" />)
                  : prescriptions.length === 0
                  ? (
                    <div className="text-center py-16 text-slate-500 bg-slate-900/60 border border-slate-800 rounded-3xl">
                      <Pill size={40} className="mx-auto mb-3 opacity-30 text-amber-500" />
                      <p className="font-semibold text-slate-400">
                        {t("prescription.noPrescriptions", "No active prescriptions")}
                      </p>
                    </div>
                  ) : prescriptions.map((rx) => (
                    <div key={rx.id} className="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 flex items-center justify-between shadow-lg hover:border-amber-500/40 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
                          <Pill size={24} className="text-amber-400" />
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-lg">{rx.name} <span className="text-sm font-medium text-slate-400">{rx.dose}</span></div>
                          <div className="text-sm text-slate-400 mt-0.5">{rx.frequency}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          {t("prescription.duration", "Refill In")}
                        </div>
                        <div className="text-lg font-extrabold text-white mt-0.5">{rx.refillIn}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* ── PROFILE ── */}
            {activeTab === "profile" && (
              <div className="space-y-4 max-w-xl">
                <h2 className="text-xl font-bold text-white mb-6">
                  {t("patient.profile", "My Profile")}
                </h2>
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
                  <div className="flex items-center gap-5">
                    <img src={patientAvatar} alt={patientName} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-emerald-500/30" />
                    <div>
                      <div className="text-xl font-extrabold text-white">{patientName}</div>
                      <div className="text-sm text-slate-400 mt-0.5">{patientEmail}</div>
                      {patientProfile?.status === "ACTIVE" ? (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">
                          <ShieldCheck size={12} /> {t("admin.verified", "Verified Patient")}
                        </div>
                      ) : (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-bold">
                          <AlertCircle size={12} /> {t("admin.pendingVerification", "Pending Admin Verification")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-6 space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-slate-800/60">
                      <span className="text-sm text-slate-500 font-medium">
                        {t("appointment.allAppointments", "Total Appointments")}
                      </span>
                      <span className="font-bold text-white">{appointments.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-800/60">
                      <span className="text-sm text-slate-500 font-medium">
                        {t("admin.completedAppts", "Completed Visits")}
                      </span>
                      <span className="font-bold text-emerald-400">{pastAppts.filter(a => a.status === "COMPLETED").length}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-slate-500 font-medium">
                        {t("admin.totalRevenue", "Total Spent")}
                      </span>
                      <span className="font-bold text-white">₹{totalSpent.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Notes Modal ── */}
      <AnimatePresence>
        {selectedAppt && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setSelectedAppt(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2"><FileText size={20} className="text-emerald-500" /> {t("prescription.notes", "Doctor's Notes")}</h3>
                <button onClick={() => setSelectedAppt(null)} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-xl transition-colors"><X size={18} /></button>
              </div>
              <div className="text-sm text-slate-400 mb-1 font-bold">{selectedAppt.doctor?.user?.name} · {new Date(selectedAppt.date).toLocaleDateString(lang === "bn" ? "bn-IN" : "en-IN")}</div>
              <p className="text-slate-300 leading-relaxed mt-3 text-[15px] font-medium">{selectedAppt.notes || t("prescription.noPrescriptionsDesc", "No notes recorded for this appointment.")}</p>
              <button onClick={() => setSelectedAppt(null)} className="mt-8 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2">
                <CheckCircle size={18} /> {t("common.confirm", "Got it")}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}