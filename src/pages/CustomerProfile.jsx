import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse, LogOut, Calendar, Clock, User, Mail, Phone,
  Edit2, Activity, FileText, Settings,
  Bell, ChevronRight, Shield, Stethoscope, TrendingUp, AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useDynamicTranslation } from "../hooks/useDynamicTranslation";
import PatientPrescriptions from "./PatientPrescriptions";

// ── Sub-components ─────────────────────────────────────────────────────────────
const AppointmentCard = memo(function AppointmentCard({ appt, t }) {
  const isUpcoming = ["CONFIRMED", "SCHEDULED", "PENDING"].includes(appt.status);
  const doctorName = appt.doctor?.user?.name || "Doctor";
  const rawSpecialty = appt.doctor?.specialization || "";
  const specialty = useDynamicTranslation(rawSpecialty);
  const avatarUrl  = appt.doctor?.user?.avatarUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctorName)}`;

  const STATUS_CLS = {
    CONFIRMED: "bg-blue-50 text-blue-600 border border-blue-100",
    COMPLETED: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    CANCELLED: "bg-red-50 text-red-600 border border-red-100",
    PENDING:   "bg-amber-50 text-amber-600 border border-amber-100",
    SCHEDULED: "bg-blue-50 text-blue-600 border border-blue-100",
  };

  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-green-200 hover:shadow-md hover:shadow-green-50 transition-all"
    >
      <img src={avatarUrl} alt={doctorName} className="w-12 h-12 rounded-xl object-cover shrink-0 ring-2 ring-slate-100" />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-900 text-sm truncate">{doctorName}</div>
        <div className="text-xs text-emerald-600 font-semibold">{specialty}</div>
        <div className="text-xs text-slate-400 mt-0.5">
          {new Date(appt.date).toLocaleDateString()} · {appt.timeSlot}
        </div>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_CLS[appt.status] || "bg-slate-50 text-slate-500 border border-slate-200"}`}>
        {t(`status.${appt.status}`) || appt.status}
      </span>
    </motion.div>
  );
});

// ── Main component ─────────────────────────────────────────────────────────────
export default function CustomerProfile() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);

  // Real data state
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading]   = useState(true);
  const [apptError,   setApptError]     = useState(null);

  const meta      = user?.user_metadata ?? {};
  const fullName  = useMemo(() => meta.full_name || user?.email?.split("@")[0] || "Patient", [meta, user]);
  const avatarUrl = useMemo(() =>
    meta.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=059669&textColor=ffffff`,
    [meta, fullName]
  );
  const initials = useMemo(() =>
    fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    [fullName]
  );

  const patientEmail = user?.email;

  // Fetch real appointments
  const fetchAppointments = useCallback(async () => {
    if (!patientEmail) {
      setApptLoading(false);
      return;
    }
    setApptLoading(true);
    setApptError(null);
    try {
      const res  = await fetch(`/api/appointments?patientEmail=${encodeURIComponent(patientEmail)}`);
      const json = await res.json();
      if (json.success) setAppointments(json.data);
      else setApptError(json.error || t("errors.loadAppointments"));
    } catch {
      setApptError(t("errors.loadAppointments"));
    } finally {
      setApptLoading(false);
    }
  }, [patientEmail, t]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const upcoming = useMemo(() =>
    appointments.filter(a => ["CONFIRMED","SCHEDULED","PENDING"].includes(a.status)),
    [appointments]
  );
  const past = useMemo(() =>
    appointments.filter(a => ["COMPLETED","CANCELLED","NO_SHOW"].includes(a.status)),
    [appointments]
  );

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/");
  }, [signOut, navigate]);

  const NAV_ITEMS = [
    { id: "overview",      label: t("patient.overview"),      Icon: Activity  },
    { id: "appointments",  label: t("appointment.appointments"), Icon: Calendar },
    { id: "records",       label: t("patient.healthRecords"),  Icon: FileText  },
    { id: "settings",      label: t("nav.settings"),           Icon: Settings  },
  ];

  const greetLabel = (() => {
    const h = new Date().getHours();
    if (h < 12) return t("patient.goodMorning");
    if (h < 17) return t("patient.goodAfternoon");
    return t("patient.goodEvening");
  })();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Top nav bar ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-6 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
              <HeartPulse size={16} className="text-white" />
            </div>
            <span className="text-lg font-extrabold text-slate-900">
              Medi<span className="text-green-600">Pulse</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              className="relative p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 hover:bg-red-50 px-3 py-2 rounded-xl transition-all">
              <LogOut size={15} /> {t("nav.logout")}
            </motion.button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar ── */}
          <aside className="lg:w-64 shrink-0 space-y-4">

            {/* Profile card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl p-6 text-white shadow-xl shadow-green-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg mb-4">
                  {meta.avatar_url ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center text-xl font-extrabold text-white">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="font-extrabold text-lg text-white leading-tight">{fullName}</div>
                <div className="text-green-100/80 text-xs mt-0.5">{user?.email}</div>
                <div className="flex items-center gap-1.5 mt-3">
                  <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                  <span className="text-xs font-semibold text-green-100">{t("patient.accountStatus")}</span>
                </div>
              </div>
            </motion.div>

            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-1"
            >
              {NAV_ITEMS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${activeTab === id
                    ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-md shadow-green-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-green-700"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {activeTab === id && <ChevronRight size={14} className="ml-auto" />}
                </button>
              ))}
            </motion.div>

            {/* Quick book */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(16,185,129,0.25)" }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              onClick={() => navigate("/")}
              className="w-full bg-white border border-green-100 text-green-700 font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:bg-green-50 transition-all"
            >
              <Stethoscope size={16} /> {t("nav.findDoctor")}
            </motion.button>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* ── OVERVIEW ── */}
                {activeTab === "overview" && (
                  <>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {greetLabel}, {fullName.split(" ")[0]} 👋
                      </h2>
                      <p className="text-slate-500 text-sm mt-1">{t("patient.healthSummary")}</p>
                    </div>

                    {/* Upcoming appointments */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-extrabold text-slate-900">{t("patient.upcomingAppointments")}</h3>
                        <button onClick={() => setActiveTab("appointments")} className="text-sm font-semibold text-green-600 hover:underline">
                          {t("patient.viewAll")}
                        </button>
                      </div>

                      {apptLoading ? (
                        <div className="space-y-3">
                          {[1,2].map(i => <div key={i} className="h-20 animate-pulse bg-white border border-slate-100 rounded-2xl" />)}
                        </div>
                      ) : apptError ? (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
                          <AlertCircle size={16} /> {apptError}
                        </div>
                      ) : upcoming.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 bg-white border border-slate-100 rounded-2xl">
                          <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm font-semibold text-slate-600">{t("patient.noAppointments")}</p>
                          <p className="text-xs mt-1">{t("patient.noAppointmentsDesc")}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {upcoming.slice(0, 3).map(a => <AppointmentCard key={a.id} appt={a} t={t} />)}
                        </div>
                      )}
                    </div>

                    {/* AI health tip */}
                    <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                        <TrendingUp size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-bold text-indigo-900 text-sm mb-1">{t("patient.aiInsight")}</div>
                        <p className="text-sm text-indigo-700 leading-relaxed">
                          {t("patient.aiInsightDesc", "Stay on top of your health by booking regular checkups with your doctors.")}
                        </p>
                        <button onClick={() => navigate("/")} className="mt-2 text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                          {t("nav.findDoctor")} →
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* ── APPOINTMENTS ── */}
                {activeTab === "appointments" && (
                  <>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t("appointment.appointments")}</h2>

                    {apptLoading ? (
                      <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse bg-white border border-slate-100 rounded-2xl" />)}</div>
                    ) : apptError ? (
                      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
                        <AlertCircle size={16} /> {apptError}
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-3">{t("appointment.upcomingAppointments")}</h3>
                          {upcoming.length === 0 ? (
                            <p className="text-sm text-slate-400 px-2">{t("appointment.noAppointments")}</p>
                          ) : (
                            <div className="space-y-3">{upcoming.map(a => <AppointmentCard key={a.id} appt={a} t={t} />)}</div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-3 mt-4">{t("appointment.pastAppointments")}</h3>
                          {past.length === 0 ? (
                            <p className="text-sm text-slate-400 px-2">{t("appointment.noAppointments")}</p>
                          ) : (
                            <div className="space-y-3">{past.map(a => <AppointmentCard key={a.id} appt={a} t={t} />)}</div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* ── HEALTH RECORDS (Prescriptions) ── */}
                {activeTab === "records" && (
                  <>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-6">{t("patient.healthRecords")}</h2>
                    <PatientPrescriptions patientId={user?.id || ""} />
                  </>
                )}

                {/* ── SETTINGS ── */}
                {activeTab === "settings" && (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t("nav.settings")}</h2>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setEditMode(!editMode)}
                        className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${editMode ? "bg-green-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                        <Edit2 size={14} /> {editMode ? t("patient.saveChanges") : t("patient.editProfile")}
                      </motion.button>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm divide-y divide-slate-50">
                      {[
                        { label: t("patient.fullName"),     value: fullName,     Icon: User,  key: "name"  },
                        { label: t("patient.emailAddress"), value: user?.email,  Icon: Mail,  key: "email" },
                        { label: t("patient.phone"),        value: meta.phone || "—", Icon: Phone, key: "phone" },
                      ].map(({ label, value, Icon, key }) => (
                        <div key={key} className="flex items-center gap-4 px-6 py-5">
                          <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0">
                            <Icon size={16} className="text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
                            {editMode && key !== "email" ? (
                              <input defaultValue={value} className="w-full text-sm font-semibold text-slate-800 border-b-2 border-green-400 bg-transparent outline-none pb-0.5" />
                            ) : (
                              <div className="text-sm font-semibold text-slate-800 truncate">{value}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Security */}
                    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Shield size={16} className="text-green-500" /> {t("patient.security")}</h3>
                      <div className="space-y-3">
                        <button className="w-full flex items-center justify-between text-sm py-3 px-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors font-medium text-slate-600">
                          {t("patient.changePassword")} <ChevronRight size={16} className="text-slate-400" />
                        </button>
                        <button
                          className="w-full flex items-center justify-between text-sm py-3 px-4 border border-red-100 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors font-medium text-red-600"
                          onClick={handleSignOut}>
                          {t("patient.signOutAll")} <LogOut size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
