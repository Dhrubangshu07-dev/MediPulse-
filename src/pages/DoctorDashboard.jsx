import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Tilt from "react-parallax-tilt";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  LogOut, CheckCircle, XCircle, Clock, CalendarCheck, Activity,
  User, ShieldCheck, Stethoscope, Star, RefreshCw, AlertCircle,
  TrendingUp, ChevronRight, FileText, BadgeCheck, FilePlus
} from "lucide-react";
import DoctorPrescriptionModal from "./DoctorPrescriptionModal";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { supabase } from "../lib/supabase";
import { syncBus, SYNC_EVENTS } from "../utils/syncBus";

const STATUS_BADGE = {
  CONFIRMED:   "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  PENDING:     "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  COMPLETED:   "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  CANCELLED:   "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  IN_PROGRESS: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  NO_SHOW:     "bg-slate-700/60 text-slate-400 border border-slate-600/30",
};

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-800 rounded-xl ${className}`} />;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();

  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [profile,       setProfile]       = useState(null);
  const [appointments,  setAppointments]  = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [apptLoading,   setApptLoading]   = useState(true);
  const [apptError,     setApptError]     = useState(null);
  const [isAvailable,   setIsAvailable]   = useState(true);
  const [activeTab,     setActiveTab]     = useState("today");
  const [selectedAppt,  setSelectedAppt]  = useState(null);

  // ── Fetch doctor profile ─────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!user?.email) return;
    setProfileLoading(true);
    try {
      const res  = await fetch(`/api/doctors/me?email=${encodeURIComponent(user.email)}`);
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
        setIsAvailable(json.data.available);
      }
    } catch (err) {
      console.error("Failed to fetch doctor profile:", err);
    } finally {
      setProfileLoading(false);
    }
  }, [user?.email]);

  // ── Fetch appointments scoped to this doctor ──────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    if (!profile?.id) return;
    setApptLoading(true);
    setApptError(null);
    try {
      const res  = await fetch(`/api/appointments?doctorId=${profile.id}`);
      const json = await res.json();
      if (json.success) setAppointments(json.data);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setApptError(t("errors.loadAppointments"));
    } finally {
      setApptLoading(false);
    }
  }, [profile?.id, t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile?.id) {
      fetchAppointments();
    }
  }, [profile?.id, fetchAppointments]);

  // ── Multi-layer Live Synchronization with Admin and Patients ────────────────
  useEffect(() => {
    // 1. Cross-tab instant syncBus listener
    const unsubSync = syncBus.onAny((type) => {
      if (type === SYNC_EVENTS.APPOINTMENT_CREATED || type === SYNC_EVENTS.APPOINTMENT_UPDATED) {
        fetchAppointments();
      }
      if (type === SYNC_EVENTS.DOCTOR_UPDATED || type === SYNC_EVENTS.DOCTORS_CHANGED) {
        fetchProfile();
        fetchAppointments();
      }
    });

    // 2. Supabase Realtime multi-table listener
    let channel = null;
    if (profile?.id) {
      channel = supabase
        .channel(`doctor:sync:${profile.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "Appointment" }, () => {
          fetchAppointments();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "DoctorProfile", filter: `id=eq.${profile.id}` }, () => {
          fetchProfile();
        })
        .subscribe();
    }

    // 3. Resilient background heartbeat polling every 8s
    const timer = setInterval(() => {
      if (profile?.id) {
        fetchAppointments();
      }
    }, 8000);

    return () => {
      unsubSync();
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [profile?.id, fetchAppointments, fetchProfile]);

  // ── Update appointment status ─────────────────────────────────────────────────
  const updateStatus = useCallback(async (id, status) => {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        // Optimistic local update
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        // Broadcast to Admin and Patient dashboards immediately
        syncBus.emit(SYNC_EVENTS.APPOINTMENT_UPDATED, { id, status, doctorId: profile?.id });
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  }, [profile?.id]);

  const handleAvailabilityToggle = async (newVal) => {
    setIsAvailable(newVal);
    if (profile?.id) {
      try {
        await fetch(`/api/doctors/${profile.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newVal ? "AVAILABLE" : "UNAVAILABLE" }),
        });
        syncBus.emit(SYNC_EVENTS.DOCTOR_UPDATED, { id: profile.id, available: newVal });
      } catch (err) {
        console.error("Error toggling doctor availability:", err);
      }
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const today = new Date().toDateString();
  const todayAppts    = useMemo(() => appointments.filter(a => new Date(a.date).toDateString() === today), [appointments, today]);
  const upcomingAppts = useMemo(() => appointments.filter(a => a.status === "CONFIRMED" || a.status === "PENDING"), [appointments]);
  const completedAppts = useMemo(() => appointments.filter(a => a.status === "COMPLETED"), [appointments]);
  const totalEarnings  = useMemo(() => completedAppts.reduce((s, a) => s + (a.totalAmount || 0), 0), [completedAppts]);

  const displayName  = profile?.name      || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Doctor";
  const displayAvatar = profile?.avatarUrl || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
  const displaySpec  = profile?.specialization || "";

  const isPageLoading = profileLoading && apptLoading;

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#050b14] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
          <p className="text-blue-400 text-sm font-bold tracking-widest uppercase">Loading your portal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b14] bg-[radial-gradient(ellipse_at_top_right,_#0a1020_0%,_#050b14_55%,_#020408_100%)] font-sans text-slate-200">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#050b14]/80 backdrop-blur-2xl border-b border-white/5 px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/40 border border-blue-400/20">
              <Stethoscope size={20} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">Medi<span className="text-blue-400">Pulse</span></span>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <ShieldCheck size={12} className="text-blue-500" />
                <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest">
                  {t("nav.doctorPortal", "Doctor Portal")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Sync Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs font-bold text-blue-400 shadow-[inset_0_-2px_4px_rgba(59,130,246,0.1)]">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              <span className="hidden sm:inline">{t("admin.liveSyncActive", "Live Sync Connected")}</span>
            </div>

            {/* Availability Toggle */}
            <div className="hidden sm:flex items-center gap-3 bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("doctor.status", "Status")}:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-9 h-5 rounded-full transition-colors duration-300 relative ${isAvailable ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-slate-700"}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${isAvailable ? "left-5" : "left-1"}`} />
                </div>
                <input type="checkbox" checked={isAvailable} onChange={e => handleAvailabilityToggle(e.target.checked)} className="sr-only" />
                <span className={`text-sm font-bold ${isAvailable ? "text-emerald-400" : "text-slate-500"}`}>
                  {isAvailable ? t("status.AVAILABLE", "Online") : t("status.OFFLINE", "Offline")}
                </span>
              </label>
            </div>

            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              <LogOut size={16} /> {t("nav.logout", "Logout")}
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── Hero / Profile Card ── */}
        <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} perspective={1000} scale={1.01} transitionSpeed={2000}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900/20 via-slate-900/40 to-slate-900/60 border border-white/10 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 backdrop-blur-xl shadow-[5px_5px_15px_#020408,-5px_-5px_15px_#0a1020]"
          >
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-5 z-10">
            <div className="relative">
              <img src={displayAvatar} alt={displayName} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-blue-500/30 shadow-xl" />
              {isAvailable && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#050b14] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {profile?.isVerified && <BadgeCheck size={16} className="text-blue-400" />}
                <p className="text-sm text-blue-400 font-bold uppercase tracking-widest">{displaySpec}</p>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{displayName}</h1>
              {profileLoading ? <Skeleton className="h-4 w-48 mt-1" /> : (
                <p className="text-slate-400 text-sm mt-0.5">{profile?.hospital || "MediPulse Hospital"} · {profile?.experience || 0} yrs experience</p>
              )}
            </div>
          </div>
          <div className="flex gap-3 z-10 flex-wrap">
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
              <div className="text-2xl font-extrabold text-blue-400">{todayAppts.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">Today</div>
            </div>
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
              <div className="text-2xl font-extrabold text-emerald-400">{completedAppts.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">Completed</div>
            </div>
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
              <div className="text-2xl font-extrabold text-white">₹{totalEarnings.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mt-0.5">Earnings</div>
            </div>
          </div>
          </motion.div>
        </Tilt>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Today's Appointments", value: todayAppts.length, Icon: CalendarCheck, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
            { label: "Total Patients Seen",  value: completedAppts.length, Icon: User, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
            { label: "Total Earnings",  value: `₹${totalEarnings.toLocaleString()}`, Icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Rating", value: profile?.rating || "—", Icon: Star, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          ].map(({ label, value, Icon, color, bg }) => (
            <Tilt key={label} tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02} transitionSpeed={2500}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-900/40 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col gap-4 shadow-[5px_5px_15px_#020408,-5px_-5px_15px_#0a1020] h-full`}
              >
                <div className={`w-12 h-12 ${bg} border rounded-2xl flex items-center justify-center shadow-[inset_0_-2px_4px_rgba(255,255,255,0.05)]`}>
                  <Icon size={24} className={color} />
                </div>
                <div>
                  <div className={`text-3xl font-extrabold ${color}`}>{apptLoading ? "—" : value}</div>
                  <div className="text-sm font-medium text-slate-400 mt-0.5">{label}</div>
                </div>
              </motion.div>
            </Tilt>
          ))}
        </div>

        {/* ── Tab switcher ── */}
        <div className="flex gap-2 p-1.5 bg-slate-900/60 border border-slate-800 rounded-2xl w-max backdrop-blur-md shadow-xl">
          {[
            { id: "today",    label: t("appointment.todayAppointments", "Today"), Icon: Clock },
            { id: "all",      label: t("appointment.allAppointments", "All Appointments"), Icon: CalendarCheck },
            { id: "profile",  label: t("doctor.profile", "My Profile"), Icon: User },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === tab.id ? "bg-blue-500 text-white shadow-lg shadow-blue-900/30" : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <tab.Icon size={15} className={activeTab === tab.id ? "text-white" : "text-slate-500"} /> {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

            {/* ── TODAY'S QUEUE ── */}
            {activeTab === "today" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {t("appointment.patientQueue", "Today's Patient Queue")}
                  </h2>
                  <button onClick={fetchAppointments} className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-sm font-bold text-slate-300 hover:text-white rounded-xl hover:bg-slate-700 transition-colors">
                    <RefreshCw size={14} className="text-blue-400" /> {t("common.refresh", "Refresh")}
                  </button>
                </div>
                
                <div className="h-32 mb-4 mt-6 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[5px_5px_15px_#020408,-5px_-5px_15px_#0a1020] flex flex-col justify-end">
                  <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Today's Activity Trend</div>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[{ time: '9AM', pts: 2 }, { time: '11AM', pts: 5 }, { time: '1PM', pts: 3 }, { time: '3PM', pts: 6 }, { time: '5PM', pts: 4 }]}>
                      <Line type="monotone" dataKey="pts" stroke="#60a5fa" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {apptError && (
                  <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-2xl text-sm font-semibold">
                    <AlertCircle size={18} /> {apptError}
                  </div>
                )}

                {apptLoading ? (
                  <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
                ) : todayAppts.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl">
                    <CalendarCheck size={48} className="mx-auto mb-4 opacity-20 text-blue-500" />
                    <p className="font-bold text-lg text-slate-300">No appointments scheduled for today.</p>
                    <p className="text-sm text-slate-500 mt-1">Your schedule is clear!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayAppts.map((appt, idx) => (
                      <motion.div key={appt.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between bg-slate-900/40 border border-white/10 hover:border-blue-500/50 rounded-2xl p-5 shadow-[5px_5px_15px_#020408,-5px_-5px_15px_#0a1020] backdrop-blur-xl transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <img src={appt.patient?.avatarUrl || `https://i.pravatar.cc/150?u=${appt.patient?.email}`} alt={appt.patient?.name}
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-700 group-hover:ring-blue-500/30 transition-all" />
                          <div>
                            <div className="font-bold text-white text-[15px]">{appt.patient?.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{appt.patient?.email}</div>
                            {appt.notes && (
                              <div className="text-xs text-blue-400/70 mt-1 flex items-center gap-1"><FileText size={11} /> {appt.notes.slice(0, 50)}…</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-400 flex items-center justify-end gap-1"><Clock size={13} /> {appt.timeSlot}</div>
                            <div className="font-bold text-white text-sm mt-1">₹{appt.totalAmount}</div>
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${STATUS_BADGE[appt.status] || STATUS_BADGE.PENDING}`}>{appt.status}</span>
                          {(appt.status === "CONFIRMED" || appt.status === "PENDING") && (
                            <div className="flex gap-2">
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => updateStatus(appt.id, "COMPLETED")}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30 transition-all text-xs"
                              >
                                <CheckCircle size={13} /> Done
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => updateStatus(appt.id, "CANCELLED")}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 font-bold rounded-lg border border-slate-700 hover:border-rose-500/30 transition-all text-xs"
                              >
                                <XCircle size={13} /> Cancel
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ALL APPOINTMENTS ── */}
            {activeTab === "all" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">All Patient Appointments</h2>
                {apptLoading ? (
                  <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                ) : (
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[5px_5px_15px_#020408,-5px_-5px_15px_#0a1020]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="border-b border-slate-800 bg-slate-900/50">
                          <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Fee</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {appointments.map(appt => (
                            <tr key={appt.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <img src={appt.patient?.avatarUrl || `https://i.pravatar.cc/150?u=${appt.patient?.email}`} alt=""
                                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-700" />
                                  <div>
                                    <div className="font-bold text-white">{appt.patient?.name}</div>
                                    <div className="text-xs text-slate-500">{appt.patient?.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-slate-300">{new Date(appt.date).toLocaleDateString()}</div>
                                <div className="text-xs text-blue-400 font-bold mt-0.5">{appt.timeSlot}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${STATUS_BADGE[appt.status] || STATUS_BADGE.PENDING}`}>{appt.status}</span>
                              </td>
                              <td className="px-6 py-4 text-right font-extrabold text-white">₹{appt.totalAmount}</td>
                              <td className="px-6 py-4 text-right">
                                {(appt.status === "CONFIRMED" || appt.status === "PENDING") ? (
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => updateStatus(appt.id, "COMPLETED")}
                                      className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 transition-all">
                                      Done
                                    </button>
                                    <button onClick={() => updateStatus(appt.id, "CANCELLED")}
                                      className="text-xs font-bold px-3 py-1.5 bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 hover:border-rose-500/30 transition-all">
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-600 font-bold uppercase">—</span>
                                )}
                                {appt.status === "COMPLETED" && (
                                  <button onClick={() => setSelectedAppt(appt)} className="text-xs font-bold px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-all flex items-center gap-1 mt-2 float-right">
                                     <FilePlus size={14} /> Prescription
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {appointments.length === 0 && (
                            <tr><td colSpan="5" className="px-6 py-16 text-center text-slate-500 font-semibold">No appointments found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PROFILE ── */}
            {activeTab === "profile" && (
              <div className="max-w-xl space-y-4">
                <h2 className="text-xl font-bold text-white mb-6">Doctor Profile</h2>
                {profileLoading ? (
                  <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
                ) : (
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6 shadow-[5px_5px_15px_#020408,-5px_-5px_15px_#0a1020]">
                    <div className="flex items-center gap-5">
                      <img src={displayAvatar} alt={displayName} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-blue-500/30" />
                      <div>
                        <div className="text-xl font-extrabold text-white">{displayName}</div>
                        <div className="text-sm text-blue-400 font-bold mt-0.5">{displaySpec}</div>
                        {profile?.isVerified && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold">
                            <BadgeCheck size={12} /> Verified Doctor
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-6">
                      {[
                        { label: t("doctor.qualification", "Qualification"),    value: profile?.qualification   || "—" },
                        { label: t("doctor.registrationNo", "Registration No."), value: profile?.registrationNo  || "—" },
                        { label: t("doctor.experience", "Experience"),       value: `${profile?.experience   || 0} ${t("doctorCard.yrs", "yrs")}` },
                        { label: t("doctor.consultationFee", "Consultation Fee"), value: `₹${profile?.fee         || 0}` },
                        { label: t("doctor.rating", "Rating"),           value: `${profile?.rating       || "—"} ⭐ (${profile?.totalReviews || 0} ${t("doctorCard.reviews", "reviews")})` },
                        { label: t("doctor.hospital", "Hospital"),         value: profile?.hospital         || "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
                          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{label}</div>
                          <div className="text-sm font-extrabold text-white">{value}</div>
                        </div>
                      ))}
                    </div>
                    {profile?.bio && (
                      <div className="border-t border-slate-800 pt-4">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Bio</div>
                        <p className="text-sm text-slate-300 leading-relaxed">{profile.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {selectedAppt && (
        <DoctorPrescriptionModal 
          appointment={selectedAppt} 
          onClose={() => setSelectedAppt(null)} 
        />
      )}
    </div>
  );
}
