import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { syncBus, SYNC_EVENTS } from "../utils/syncBus";
import Tilt from "react-parallax-tilt";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Plus, Edit2, Trash2, LogOut, CheckCircle, X,
  ShieldCheck, Users, HeartPulse, TrendingUp, Search,
  Star, AlertTriangle, Calendar, Activity, Pill, BarChart3,
  CalendarCheck, Clock, Stethoscope, UserCheck, UserX, Check, CheckCircle2, Radio
} from "lucide-react";

// ── Field helper ──────────────────────────────────────────────────────────────
function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS = "w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 transition-all";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [doctors, setDoctors]     = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients]   = useState([]);
  const [session, setSession]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [patientSearchQ, setPatientSearchQ] = useState("");
  
  // Doctor management state
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [searchQ, setSearchQ]     = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", email: "", specialty: "", specialization: "", hospital: "",
    fee: 0, experience: 0, qualification: "", registrationNo: "",
    bio: "", nextSlot: "", consultType: ["In-clinic"],
    avatarUrl: "", available: true, isVerified: false,
  });

  const { t } = useLanguage();
  const setF = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const fetchDoctors = useCallback(async () => {
    try {
      const res  = await fetch("/api/doctors");
      const json = await res.json();
      if (json.success) setDoctors(json.data);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/appointments");
      const json = await res.json();
      if (json.success) setAppointments(json.data);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch("/api/patients");
      const json = await res.json();
      if (json.success) setPatients(json.data || []);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        // Local state update
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        // Instant cross-tab sync to Doctor and Patient panels
        syncBus.emit(SYNC_EVENTS.APPOINTMENT_UPDATED, { id, status });
        fetchAppointments();
      } else {
        const d = await res.json();
        alert(`Failed to update status: ${d.error}`);
      }
    } catch (err) {
      console.error("Error updating appointment status:", err);
    }
  };

  const updatePatientStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/patients/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setPatients(prev => prev.map(p => p.id === id ? { ...p, status } : p));
        // Instant cross-tab sync to Patient Panel
        syncBus.emit(SYNC_EVENTS.PATIENT_UPDATED, { id, status });
        fetchPatients();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update patient status");
      }
    } catch (err) {
      console.error("Error updating patient status:", err);
    }
  };

  useEffect(() => {
    let supabaseChannel = null;

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!session) {
          navigate("/admin/login");
        } else {
          setSession(session);
          fetchDoctors();
          fetchAppointments().then(() => setLoading(false));
          fetchPatients();

          // 1. Listen to instant cross-tab syncBus events from Patient or Doctor panels
          const unsubSync = syncBus.onAny((type) => {
            if (type === SYNC_EVENTS.APPOINTMENT_CREATED || type === SYNC_EVENTS.APPOINTMENT_UPDATED) {
              fetchAppointments();
            }
            if (type === SYNC_EVENTS.DOCTORS_CHANGED || type === SYNC_EVENTS.DOCTOR_UPDATED) {
              fetchDoctors();
            }
            if (type === SYNC_EVENTS.PATIENT_UPDATED) {
              fetchPatients();
            }
          });

          // 2. Supabase Realtime multi-table listener for multi-device sync
          supabaseChannel = supabase
            .channel("admin:all_sync")
            .on("postgres_changes", { event: "*", schema: "public", table: "DoctorProfile" }, () => fetchDoctors())
            .on("postgres_changes", { event: "*", schema: "public", table: "Appointment" }, () => fetchAppointments())
            .on("postgres_changes", { event: "*", schema: "public", table: "User" }, () => { fetchPatients(); fetchDoctors(); })
            .subscribe();

          // 3. Resilient background heartbeat polling every 8s
          const heartbeatTimer = setInterval(() => {
            fetchAppointments();
            fetchDoctors();
            fetchPatients();
          }, 8000);

          return () => {
            unsubSync();
            clearInterval(heartbeatTimer);
            if (supabaseChannel) supabase.removeChannel(supabaseChannel);
          };
        }
      })
      .catch((err) => {
        console.error("Auth check failed in AdminDashboard:", err);
      });

    return () => {
      if (supabaseChannel) supabase.removeChannel(supabaseChannel);
    };
  }, [navigate, fetchDoctors, fetchAppointments, fetchPatients]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/");
  }, [navigate]);

  // ── Doctor CRUD ─────────────────────────────────────────────────────────────
  const openAddModal = useCallback(() => {
    setEditingDoc(null);
    setForm({
      name: "", email: "", specialty: "", specialization: "", hospital: "",
      fee: 0, experience: 0, qualification: "", registrationNo: "",
      bio: "", nextSlot: "", consultType: ["In-clinic"],
      avatarUrl: "", available: true, isVerified: false,
    });
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((doc) => {
    setEditingDoc(doc);
    setForm({ ...doc });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/doctors/${deleteTarget.id}`, { method: "DELETE" });
      const d = await res.json();
      if (res.ok) {
        fetchDoctors();
        setDeleteTarget(null);
        syncBus.emit(SYNC_EVENTS.DOCTORS_CHANGED, { id: deleteTarget.id, action: "deleted" });
      }
      else alert(d.error || t("errors.deleteFailed"));
    } catch (err) { console.error("Error deleting:", err); alert(t("errors.deleteFailed")); }
  }, [deleteTarget, fetchDoctors, t]);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    const url = editingDoc ? `/api/doctors/${editingDoc.id}` : "/api/doctors";
    // Map form field aliases to canonical names
    const payload = {
      ...form,
      specialization: form.specialization || form.specialty,
      experienceYears: Number(form.experience || form.experienceYears) || 0,
      consultationFee: Number(form.fee || form.consultationFee) || 0,
    };
    try {
      const res = await fetch(url, {
        method: editingDoc ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (res.ok) {
        setShowModal(false);
        fetchDoctors();
        syncBus.emit(SYNC_EVENTS.DOCTOR_UPDATED, { doctor: d.data, id: editingDoc?.id || d.data?.id });
        syncBus.emit(SYNC_EVENTS.DOCTORS_CHANGED, { doctor: d.data });
      }
      else alert(d.error || t("errors.saveFailed"));
    } catch (err) { console.error("Error saving:", err); alert(t("errors.saveFailed")); }
  }, [editingDoc, form, fetchDoctors, t]);

  const filtered = useMemo(() => doctors.filter(
    (d) =>
      !searchQ ||
      d.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(searchQ.toLowerCase()) ||
      d.hospital?.toLowerCase().includes(searchQ.toLowerCase())
  ), [doctors, searchQ]);

  const stats = useMemo(() => [
    { label: t("admin.totalDoctors"), value: doctors.length,                                    Icon: Users,     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: t("admin.availableNow"), value: doctors.filter((d) => d.available).length,         Icon: HeartPulse, color: "text-green-400",   bg: "bg-green-500/10 border-green-500/20"   },
    { label: t("admin.avgRating"),    value: doctors.length ? (doctors.reduce((a, d) => a + (d.rating || 0), 0) / doctors.length).toFixed(1) : "—", Icon: Star, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: t("admin.avgFee"),       value: doctors.length ? `₹${Math.round(doctors.reduce((a, d) => a + (d.fee || 0), 0) / doctors.length)}` : "—", Icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  ], [doctors, t]);

  // ── Render Views ────────────────────────────────────────────────────────────

  const renderAnalytics = () => {
    const totalRevenue = appointments.reduce((a, b) => a + (b.totalAmount || 0), 0);
    const completedAppts = appointments.filter(a => a.status === "COMPLETED").length;
    const pendingAppts = appointments.filter(a => a.status === "PENDING" || a.status === "SCHEDULED").length;

    const chartData = (() => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dataMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      
      appointments.forEach(a => {
        if (a.status !== 'CANCELLED') {
          const d = new Date(a.date);
          const dayName = days[d.getDay()];
          dataMap[dayName] += (a.totalAmount || 0);
        }
      });
      
      return [
        { name: 'Mon', revenue: dataMap['Mon'] },
        { name: 'Tue', revenue: dataMap['Tue'] },
        { name: 'Wed', revenue: dataMap['Wed'] },
        { name: 'Thu', revenue: dataMap['Thu'] },
        { name: 'Fri', revenue: dataMap['Fri'] },
        { name: 'Sat', revenue: dataMap['Sat'] },
        { name: 'Sun', revenue: dataMap['Sun'] },
      ];
    })();
  
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">{t("admin.analytics", "Analytics Overview")}</h2>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02} transitionSpeed={2500}>
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 backdrop-blur-xl shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914] h-full">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[inset_0_-2px_4px_rgba(16,185,129,0.3)]">
                <TrendingUp size={24} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">₹{totalRevenue.toLocaleString()}</div>
                <div className="text-sm font-medium text-slate-400">{t("admin.totalRevenue", "Total Revenue")}</div>
              </div>
            </div>
          </Tilt>
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02} transitionSpeed={2500}>
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 backdrop-blur-xl shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914] h-full">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[inset_0_-2px_4px_rgba(59,130,246,0.3)]">
                <Users size={24} className="text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">{doctors.length}</div>
                <div className="text-sm font-medium text-slate-400">{t("admin.totalDoctors", "Total Doctors")}</div>
              </div>
            </div>
          </Tilt>
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02} transitionSpeed={2500}>
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 backdrop-blur-xl shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914] h-full">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[inset_0_-2px_4px_rgba(168,85,247,0.3)]">
                <CheckCircle size={24} className="text-purple-400" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">{completedAppts} <span className="text-lg text-slate-500">/ {appointments.length}</span></div>
                <div className="text-sm font-medium text-slate-400">{t("admin.completedAppts", "Appointments Completed")}</div>
              </div>
            </div>
          </Tilt>
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02} transitionSpeed={2500}>
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 backdrop-blur-xl shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914] h-full">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[inset_0_-2px_4px_rgba(245,158,11,0.3)]">
                <Pill size={24} className="text-amber-400" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">{pendingAppts}</div>
                <div className="text-sm font-medium text-slate-400">{t("admin.pendingAppts", "Pending Appointments")}</div>
              </div>
            </div>
          </Tilt>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <Tilt className="lg:col-span-2" tiltMaxAngleX={2} tiltMaxAngleY={2} perspective={1000} scale={1.01} transitionSpeed={2000}>
             <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-80 shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914] relative overflow-hidden flex flex-col">
                 <h3 className="text-lg font-bold text-white mb-4">Revenue Trend</h3>
                 <div className="flex-1 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                       <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                       <YAxis stroke="#94a3b8" fontSize={12} />
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                       <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
             </div>
           </Tilt>
           <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914]">
               <h3 className="text-lg font-bold text-white mb-6">Recent Activity</h3>
               <div className="space-y-5">
                  {appointments.slice(0, 4).map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                       <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                       <div>
                         <div className="text-sm font-semibold text-white">New appointment for {a.doctor?.user?.name}</div>
                         <div className="text-xs text-slate-500 mt-0.5">{new Date(a.date).toLocaleDateString()} at {a.timeSlot}</div>
                       </div>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <div className="text-slate-500 text-sm">No recent activity.</div>
                  )}
               </div>
           </div>
        </div>
      </motion.div>
    );
  };

  const renderAppointments = () => {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">{t("appointment.allAppointments", "All Appointments")}</h2>
            <p className="text-slate-500 mt-1 text-sm">{t("admin.appointments", "View and manage all patient bookings across the network.")}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={fetchAppointments}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition-colors shadow-lg"
          >
            <Activity size={18} className="text-emerald-400" /> {t("common.refresh", "Refresh Data")}
          </motion.button>
        </div>
  
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Fee</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <AnimatePresence>
                  {appointments.map((appt, idx) => (
                    <motion.tr
                      key={appt.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{appt.patient?.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{appt.patient?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-emerald-400 text-sm">{appt.doctor?.user?.name || "Offline Doctor"}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{appt.doctor?.specialization || "General"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{new Date(appt.date).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={12}/> {appt.timeSlot}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold ${appt.status === "COMPLETED" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : appt.status === "CONFIRMED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-extrabold text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">₹{appt.totalAmount}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(appt.status === "PENDING" || appt.status === "SCHEDULED") && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updateStatus(appt.id, "CONFIRMED")}
                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <Check size={12} /> {t("admin.confirmAppt", "Confirm")}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updateStatus(appt.id, "CANCELLED")}
                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                              >
                                {t("admin.rejectAppt", "Reject")}
                              </motion.button>
                            </>
                          )}
                          {appt.status === "CONFIRMED" && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updateStatus(appt.id, "COMPLETED")}
                                className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 size={12} /> {t("admin.completeAppt", "Complete")}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updateStatus(appt.id, "CANCELLED")}
                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                              >
                                {t("admin.rejectAppt", "Cancel")}
                              </motion.button>
                            </>
                          )}
                          {appt.status === "COMPLETED" && (
                            <span className="text-xs font-semibold text-emerald-400 px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                              {t("status.COMPLETED", "Completed")}
                            </span>
                          )}
                          {appt.status === "CANCELLED" && (
                            <span className="text-xs font-semibold text-rose-400 px-2.5 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20">
                              {t("status.CANCELLED", "Cancelled")}
                            </span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-slate-600">
                      <CalendarCheck size={36} className="mx-auto mb-3 opacity-30 text-emerald-500" />
                      <p className="font-semibold text-slate-400">No appointments found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderDoctors = () => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* ── Page title ── */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t("admin.doctors", "Doctor Management")}</h1>
        <p className="text-slate-500 mt-1 text-sm">{t("admin.dashboardDesc", "Add, edit, or remove doctors from the MediPulse network.")}</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon, color, bg }) => (
          <Tilt key={label} tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02} transitionSpeed={2500}>
            <div className={`bg-slate-900/40 border border-white/10 rounded-3xl p-5 flex items-center gap-4 backdrop-blur-xl shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914]`}>
              <div className={`w-12 h-12 rounded-2xl ${bg} border flex items-center justify-center shrink-0 shadow-[inset_0_-2px_4px_rgba(255,255,255,0.05)]`}>
                <Icon size={24} className={color} />
              </div>
              <div>
                <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">{label}</div>
              </div>
            </div>
          </Tilt>
        ))}
      </div>

      {/* ── Actions bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mt-8">
        <label className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3 w-full sm:w-80 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all shadow-md">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder={t("admin.searchDoctors", "Search by name, specialty...")}
            className="flex-1 bg-transparent text-sm font-medium text-white placeholder-slate-500 outline-none"
          />
        </label>

        <motion.button
          whileHover={{ scale: 1.03, boxShadow: "0 8px 20px rgba(16,185,129,0.3)" }}
          whileTap={{ scale: 0.97 }}
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-green-900/30 whitespace-nowrap transition-all"
        >
          <Plus size={18} /> {t("admin.addDoctor", "Add New Doctor")}
        </motion.button>
      </div>

      {/* ── Table ── */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-800 bg-slate-900/50">
              <tr>
                {["Doctor", "Specialty & Hospital", "Fee / Exp.", "Status", "Actions"].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${i === 4 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <AnimatePresence>
                {filtered.map((doc, idx) => (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.image || `https://i.pravatar.cc/150?u=${doc.id}`}
                          alt={doc.name}
                          loading="lazy"
                          className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-700 shadow-lg"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{doc.name}</div>
                          <div className="text-xs text-emerald-500 mt-0.5">{doc.badge || "Standard Provider"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200 text-sm">{doc.specialty}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[220px] mt-0.5">{doc.hospital}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-white text-sm bg-slate-800 inline-block px-2 py-1 rounded border border-slate-700">₹{doc.fee}</div>
                      <div className="text-xs text-slate-400 mt-1.5">{doc.experience} yrs exp.</div>
                    </td>
                    <td className="px-6 py-4">
                      {doc.available ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-700/60 text-slate-400 border border-slate-600/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Unavailable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => openEditModal(doc)}
                          className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors border border-transparent hover:border-emerald-500/20"
                        >
                          <Edit2 size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setDeleteTarget(doc)}
                          className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-slate-600">
                    <Users size={48} className="mx-auto mb-4 opacity-20 text-emerald-500" />
                    <p className="font-semibold text-lg text-slate-400">No doctors found.</p>
                    <p className="text-sm mt-1 text-slate-500">Try adjusting your search or add a new doctor.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (!patientSearchQ) return true;
      const q = patientSearchQ.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q)
      );
    });
  }, [patients, patientSearchQ]);

  const renderPatients = () => {
    const verifiedCount = patients.filter((p) => p.status === "ACTIVE").length;
    const pendingCount  = patients.filter((p) => p.status !== "ACTIVE" && p.status !== "BLOCKED").length;
    const totalBookings = patients.reduce((s, p) => s + (p.totalAppointments || 0), 0);

    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{t("admin.managePatients", "Patient Management")}</h1>
            <p className="text-slate-500 mt-1 text-sm">{t("admin.patientDetails", "Verify, monitor, and synchronize registered patient profiles.")}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={fetchPatients}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition-colors shadow-lg"
          >
            <Activity size={18} className="text-emerald-400" /> {t("common.refresh", "Refresh Data")}
          </motion.button>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02} transitionSpeed={2500}>
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 flex items-center gap-4 backdrop-blur-xl shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914]">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Users size={24} className="text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-blue-400">{patients.length}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">{t("admin.totalPatients", "Total Patients")}</div>
              </div>
            </div>
          </Tilt>
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02} transitionSpeed={2500}>
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 flex items-center gap-4 backdrop-blur-xl shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-emerald-400">{verifiedCount}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">{t("admin.verified", "Verified")}</div>
              </div>
            </div>
          </Tilt>
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02} transitionSpeed={2500}>
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 flex items-center gap-4 backdrop-blur-xl shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914]">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} className="text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-amber-400">{pendingCount}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">{t("admin.pendingVerification", "Pending")}</div>
              </div>
            </div>
          </Tilt>
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02} transitionSpeed={2500}>
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 flex items-center gap-4 backdrop-blur-xl shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914]">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <CalendarCheck size={24} className="text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-purple-400">{totalBookings}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">{t("admin.totalBookings", "Total Bookings")}</div>
              </div>
            </div>
          </Tilt>
        </div>

        {/* ── Search bar ── */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3 w-full sm:w-80 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all shadow-md">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              value={patientSearchQ}
              onChange={(e) => setPatientSearchQ(e.target.value)}
              placeholder={t("admin.searchPatients", "Search patients...")}
              className="flex-1 bg-transparent text-sm font-medium text-white placeholder-slate-500 outline-none"
            />
          </label>
        </div>

        {/* ── Table ── */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[5px_5px_15px_#030509,-5px_-5px_15px_#0a1914]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("admin.patients", "Patient")}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("patient.emailAddress", "Email & Contact")}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("admin.status", "Status")}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t("admin.totalBookings", "Bookings")}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t("admin.joined", "Registered")}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t("admin.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <AnimatePresence>
                  {filteredPatients.map((p, idx) => {
                    const isVerified = p.status === "ACTIVE";
                    const isBlocked = p.status === "BLOCKED";
                    const avatar = p.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.name || "Patient")}`;

                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={avatar}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-700 shadow-md"
                            />
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                {p.name || "Unnamed Patient"}
                                {isVerified && <CheckCircle size={14} className="text-emerald-400" />}
                              </div>
                              <div className="text-xs text-slate-500">ID: {p.id.slice(0, 10)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-200 text-sm">{p.email}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{p.phone || "No phone provided"}</div>
                        </td>
                        <td className="px-6 py-4">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t("admin.verified", "Verified")}
                            </span>
                          ) : isBlocked ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {t("admin.blocked", "Blocked")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> {t("admin.pendingVerification", "Pending Verification")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-extrabold text-white text-sm bg-slate-800 inline-block px-3 py-1 rounded-lg border border-slate-700">
                            {p.totalAppointments || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isVerified && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updatePatientStatus(p.id, "ACTIVE")}
                                className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 flex items-center gap-1.5 transition-all"
                              >
                                <UserCheck size={14} /> {t("admin.verifyPatient", "Verify Patient")}
                              </motion.button>
                            )}
                            {isVerified && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updatePatientStatus(p.id, "BLOCKED")}
                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                              >
                                <UserX size={13} /> {t("admin.blockPatient", "Block")}
                              </motion.button>
                            )}
                            {isBlocked && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updatePatientStatus(p.id, "ACTIVE")}
                                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                              >
                                {t("admin.unblockPatient", "Activate")}
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-slate-600">
                      <Users size={48} className="mx-auto mb-4 opacity-20 text-emerald-500" />
                      <p className="font-semibold text-lg text-slate-400">{t("admin.noPatients", "No patients found.")}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  // ── Main Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          <p className="text-emerald-500 text-sm font-bold tracking-widest uppercase">Initializing Portal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b13] bg-[radial-gradient(ellipse_at_top,_#0a1914_0%,_#060b13_60%,_#030509_100%)] font-sans text-slate-200">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-slate-900/40 backdrop-blur-2xl border-b border-white/10 px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-900/40 border border-green-400/20">
              <HeartPulse size={20} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Medi<span className="text-emerald-400">Pulse</span>
              </span>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Super Admin</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Sync Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400 shadow-[inset_0_-2px_4px_rgba(16,185,129,0.1)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="hidden sm:inline">{t("admin.liveSyncActive", "Live Sync Connected")}</span>
            </div>

            <div className="hidden sm:block text-right">
              <div className="text-sm font-bold text-white">{session?.user?.email}</div>
              <div className="text-xs text-emerald-500 font-medium">Session Active</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              <LogOut size={16} /> Logout
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ── Tab Switcher ── */}
        <div className="flex gap-2 p-1.5 bg-slate-900/60 border border-slate-800 rounded-2xl w-max mb-8 backdrop-blur-md shadow-xl flex-wrap">
          {[
            { id: "analytics", label: t("admin.analytics", "Analytics"), Icon: BarChart3 },
            { id: "doctors", label: t("admin.doctors", "Manage Doctors"), Icon: Stethoscope },
            { id: "appointments", label: t("admin.appointments", "Appointments"), Icon: CalendarCheck },
            { id: "patients", label: t("admin.managePatients", "Manage Patients"), Icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === tab.id 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/30" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <tab.Icon size={16} className={activeTab === tab.id ? "text-white" : "text-slate-500"} /> 
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Dynamic Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "analytics" && renderAnalytics()}
            {activeTab === "doctors" && renderDoctors()}
            {activeTab === "appointments" && renderAppointments()}
            {activeTab === "patients" && renderPatients()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Add / Edit Modal ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-800/60 bg-slate-800/20 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    {editingDoc ? <Edit2 size={20} className="text-emerald-500" /> : <Plus size={20} className="text-emerald-500" />}
                    {editingDoc ? "Edit Doctor Profile" : "Add New Doctor"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Fields marked * are required</p>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowModal(false)} className="p-2.5 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700">
                  <X size={18} />
                </motion.button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-900/50">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 sm:col-span-1">
                    <FormField label="Full Name" required>
                      <input required value={form.name} onChange={(e) => setF("name", e.target.value)} className={INPUT_CLS} placeholder="Dr. Jane Smith" />
                    </FormField>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <FormField label="Email" required>
                      <input required type="email" value={form.email} onChange={(e) => setF("email", e.target.value)} className={INPUT_CLS} placeholder="jane@example.com" />
                    </FormField>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <FormField label="Specialty" required>
                      <input required value={form.specialty} onChange={(e) => setF("specialty", e.target.value)} className={INPUT_CLS} placeholder="Cardiologist" />
                    </FormField>
                  </div>
                  <div className="col-span-2">
                    <FormField label="Hospital / Clinic" required>
                      <input required value={form.hospital} onChange={(e) => setF("hospital", e.target.value)} className={INPUT_CLS} placeholder="Apollo Hospital, Mumbai" />
                    </FormField>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <FormField label="Consultation Fee (₹)" required>
                      <input type="number" required min="0" value={form.fee} onChange={(e) => setF("fee", parseInt(e.target.value) || 0)} className={INPUT_CLS} />
                    </FormField>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <FormField label="Experience (Years)" required>
                      <input type="number" required min="0" value={form.experience} onChange={(e) => setF("experience", parseInt(e.target.value) || 0)} className={INPUT_CLS} />
                    </FormField>
                  </div>
                  <div className="col-span-2">
                    <FormField label="Profile Image URL">
                      <input value={form.image} onChange={(e) => setF("image", e.target.value)} className={INPUT_CLS} placeholder="https://..." />
                    </FormField>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <FormField label="Badge Text">
                      <input value={form.badge} onChange={(e) => setF("badge", e.target.value)} className={INPUT_CLS} placeholder="Top Rated" />
                    </FormField>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <FormField label="Next Available Slot">
                      <input value={form.nextSlot} onChange={(e) => setF("nextSlot", e.target.value)} className={INPUT_CLS} placeholder="Today, 4:00 PM" />
                    </FormField>
                  </div>
                  <div className="col-span-2 mt-2">
                    <label className="flex items-center gap-4 cursor-pointer p-5 bg-slate-800/40 border border-slate-700/80 rounded-2xl hover:border-emerald-500/50 transition-all shadow-inner">
                      <div className={`w-12 h-7 rounded-full transition-colors duration-300 relative ${form.available ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-slate-700"}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${form.available ? "left-6" : "left-1"}`} />
                      </div>
                      <input type="checkbox" checked={form.available} onChange={(e) => setF("available", e.target.checked)} className="sr-only" />
                      <div>
                        <div className="text-sm font-bold text-white">
                          {form.available ? "Accepting Appointments" : "Currently Unavailable"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">Toggle to show/hide from patient portal</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800/60 flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-sm font-bold text-slate-400 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-xl transition-colors">
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: "0 8px 20px rgba(16,185,129,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center gap-2 shadow-lg"
                  >
                    <CheckCircle size={18} /> {editingDoc ? "Save Changes" : "Publish Doctor"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete confirm dialog ── */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
            >
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertTriangle size={32} className="text-rose-500" />
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Delete Doctor?</h3>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                Are you sure you want to permanently remove <strong className="text-white bg-slate-800 px-2 py-0.5 rounded">{deleteTarget.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  className="w-full py-3.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-lg shadow-rose-900/30"
                >
                  Yes, Delete Permanently
                </motion.button>
                <button onClick={() => setDeleteTarget(null)} className="w-full py-3.5 text-sm font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
