import { useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, Mail, Lock, Eye, EyeOff, User, ArrowRight,
  CheckCircle, AlertCircle, Loader2, ArrowLeft, KeyRound,
  Sparkles, Stethoscope, ShieldCheck, UserCheck,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

// ─── View states ──────────────────────────────────────────────────────────────
const VIEWS = { ROLE: "role", SIGN_IN: "sign_in", SIGN_UP: "sign_up", FORGOT: "forgot", VERIFY: "verify" };

// ─── Password strength ─────────────────────────────────────────────────────
function getStrength(pw) {
  const checks = {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[^A-Za-z0-9]/.test(pw),
  };
  return { score: Object.values(checks).filter(Boolean).length, checks };
}
const STR_LABEL = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const STR_COLOR = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500", "bg-emerald-500"];

// ─── Field component ──────────────────────────────────────────────────────────
function Field({ id, label, type = "text", value, onChange, placeholder, error, required, autoComplete, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className={`relative flex items-center rounded-2xl border-2 transition-all duration-200 ${
        error ? "border-rose-400 bg-rose-50/40"
          : focused ? "border-emerald-500 bg-white shadow-lg shadow-emerald-500/10"
          : "border-slate-200 bg-slate-50/60 hover:border-slate-300"
      }`}>
        {children}
        <input
          id={id} name={id} type={type} value={value}
          onChange={onChange} placeholder={placeholder}
          autoComplete={autoComplete} required={required}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <AlertCircle size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Role picker card ──────────────────────────────────────────────────────────
function RoleCard({ role, icon: Icon, title, description, features, gradient, selected, onSelect }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(role)}
      className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-200 relative overflow-hidden ${
        selected
          ? `border-transparent ring-2 ring-offset-2 ${role === "customer" ? "ring-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50" : "ring-indigo-500 bg-gradient-to-br from-indigo-50 to-violet-50"}`
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      {/* Selected indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute top-4 right-4"
        >
          <CheckCircle size={20} className={role === "customer" ? "text-emerald-500" : "text-indigo-500"} />
        </motion.div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon size={24} className="text-white" />
      </div>

      <div className="font-extrabold text-slate-900 text-lg mb-1">{title}</div>
      <div className="text-sm text-slate-500 mb-4 leading-relaxed">{description}</div>

      <ul className="space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
              <CheckCircle size={10} className="text-white" />
            </div>
            {f}
          </li>
        ))}
      </ul>
    </motion.button>
  );
}

// ─── Left panel branding ───────────────────────────────────────────────────────
const PANEL_FEATURES = [
  "Book top-rated doctors instantly",
  "AI-powered symptom analysis",
  "Secure HD video consultations",
  "HIPAA-compliant health records",
];

// ─── Main component ────────────────────────────────────────────────────────────
export default function Login() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { t, lang } = useLanguage();

  // Determine initial view from nav state
  const navState    = location.state;
  const initView    = navState?.view === "sign_up" ? VIEWS.SIGN_UP
    : navState?.view === "sign_in" ? VIEWS.SIGN_IN
    : VIEWS.ROLE;

  const [view, setView]             = useState(initView);
  const [selectedRole, setSelectedRole] = useState(navState?.role ?? null); // "customer" | "doctor" | "admin"
  const [loading, setLoading]       = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [fullName, setFullName]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [adminKey, setAdminKey]     = useState("");  // admin secret

  const [errors, setErrors] = useState({});
  const pwStrength = getStrength(password);

  const switchView = useCallback((v, role) => {
    setView(v);
    if (role !== undefined) setSelectedRole(role);
    setGlobalError("");
    setErrors({});
    setPassword("");
    setConfirmPw("");
    setAdminKey("");
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const e = {};
    if (view === VIEWS.SIGN_UP && !fullName.trim()) e.fullName = "Full name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
    if (view !== VIEWS.FORGOT) {
      if (!password) e.password = "Password is required.";
      else if (view === VIEWS.SIGN_UP && password.length < 8) e.password = "Minimum 8 characters.";
    }
    if (view === VIEWS.SIGN_UP) {
      if (!confirmPw) e.confirmPw = "Please confirm your password.";
      else if (password !== confirmPw) e.confirmPw = "Passwords do not match.";
      if (selectedRole === "admin" && adminKey !== "MEDIPULSE_ADMIN_2024") {
        e.adminKey = "Invalid admin access code.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [view, fullName, email, password, confirmPw, selectedRole, adminKey]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    setLoading(true);
    try {
      if (view === VIEWS.SIGN_IN) {
        const { user } = await signIn(email, password);
        const role = user?.user_metadata?.role ?? selectedRole ?? "customer";
        if (role === "admin") navigate("/admin/dashboard", { replace: true });
        else if (role === "doctor") navigate("/doctor/dashboard", { replace: true });
        else navigate("/patient/dashboard", { replace: true });
      }
      if (view === VIEWS.SIGN_UP) {
        const res = await signUp(email, password, fullName, selectedRole);
        const role = res?.user?.user_metadata?.role ?? selectedRole;
        if (role === "admin") navigate("/admin/dashboard", { replace: true });
        else if (role === "doctor") navigate("/doctor/dashboard", { replace: true });
        else navigate("/patient/dashboard", { replace: true });
      }
      if (view === VIEWS.FORGOT) {
        const { error } = await import("../lib/supabase").then(m =>
          m.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          })
        );
        if (error) throw error;
        setGlobalError(""); // clear
        switchView(VIEWS.VERIFY);
      }
    } catch (err) {
      const msg = err?.message ?? "An unexpected error occurred.";
      setGlobalError(
        msg.includes("Invalid login credentials") ? "Incorrect email or password. Please try again."
          : msg.includes("User already registered") ? "An account with this email already exists."
          : msg.includes("Email not confirmed") ? "Please verify your email first — check your inbox."
          : msg
      );
    } finally {
      setLoading(false);
    }
  }, [view, validate, signIn, signUp, email, password, fullName, selectedRole, navigate, switchView]);

  const handleGoogle = useCallback(async () => {
    try { setLoading(true); await signInWithGoogle(); }
    catch (err) { setGlobalError(err.message); setLoading(false); }
  }, [signInWithGoogle]);

  // ─── Page meta ─────────────────────────────────────────────────────────────
  const titles = {
    [VIEWS.ROLE]:    { h: lang === "bn" ? "আপনি কীভাবে যুক্ত হতে চান?" : "How are you joining?",      sub: lang === "bn" ? "শুরু করতে আপনার অ্যাকাউন্টের ধরন বেছে নিন" : "Select your account type to get started" },
    [VIEWS.SIGN_IN]: { h: t("auth.welcomeBack", "Welcome back"),              sub: lang === "bn" ? "আপনার MediPulse অ্যাকাউন্টে সাইন ইন করুন" : "Sign in to your MediPulse account" },
    [VIEWS.SIGN_UP]: { h: selectedRole === "admin" ? (lang === "bn" ? "অ্যাডমিন নিবন্ধন" : "Admin Registration") : t("auth.signUp", "Create your account"),
                       sub: selectedRole === "admin" ? (lang === "bn" ? "অ্যাডমিন পোর্টালে প্রবেশের ব্যবস্থা করুন" : "Set up your admin portal access") : (lang === "bn" ? "মেডিপালসে ৫০,০০০+ রোগীর সাথে যুক্ত হোন" : "Join 50,000+ patients on MediPulse") },
    [VIEWS.FORGOT]:  { h: lang === "bn" ? "পাসওয়ার্ড রিসেট করুন" : "Reset your password",       sub: lang === "bn" ? "আমরা আপনাকে একটি নিরাপদ রিসেট লিংক পাঠাব" : "We'll send you a secure reset link" },
    [VIEWS.VERIFY]:  { h: lang === "bn" ? "আপনার ইনবক্স পরীক্ষা করুন" : "Check your inbox",          sub: lang === "bn" ? "আপনার ইমেইল যাচাই করুন" : "Almost there — verify your email" },
  };
  const { h: heading, sub: subheading } = titles[view];

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between bg-[radial-gradient(ellipse_at_top_left,_#064e3b_0%,_#065f46_35%,_#047857_65%,_#059669_100%)] px-12 py-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-teal-400/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-20 right-0 w-72 h-72 bg-green-300/15 rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        </div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.6, ease: [0.22,1,0.36,1] }}
          className="flex items-center gap-3 z-10 cursor-pointer" onClick={() => navigate(-1)}>
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl">
            <HeartPulse size={22} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">
            Medi<span className="text-green-300">Pulse</span>
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="z-10 space-y-6">
          <div>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Healthcare that{" "}
              <span className="bg-gradient-to-r from-green-300 to-teal-300 bg-clip-text text-transparent">works for you</span>
            </h2>
            <p className="text-green-100/70 mt-3 text-base leading-relaxed">Join over 50,000 patients who trust MediPulse for seamless, AI-powered healthcare.</p>
          </div>
          {PANEL_FEATURES.map((feat, i) => (
            <motion.div key={feat} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
              className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-400/20 border border-green-400/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle size={13} className="text-green-300" />
              </div>
              <span className="text-sm text-green-100/80 font-medium leading-relaxed">{feat}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6">
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 fill-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-sm text-white/80 leading-relaxed italic mb-3">
            "Booked a specialist in under 2 minutes. The AI diagnosis was incredibly accurate. MediPulse changed how I manage my health."
          </p>
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/36?img=47" alt="" className="w-9 h-9 rounded-full ring-2 ring-white/30" />
            <div>
              <div className="text-xs font-bold text-white">Priya Sharma</div>
              <div className="text-xs text-green-200/60">Patient · Mumbai</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 py-12 bg-white relative">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
            <HeartPulse size={18} className="text-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900">Medi<span className="text-green-600">Pulse</span></span>
        </div>

        <div className="w-full max-w-[460px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Back nav */}
              {(view === VIEWS.SIGN_IN || view === VIEWS.SIGN_UP) && (
                <button onClick={() => switchView(VIEWS.ROLE)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-600 mb-5 transition-colors">
                  <ArrowLeft size={15} /> Choose account type
                </button>
              )}
              {(view === VIEWS.FORGOT || view === VIEWS.VERIFY) && (
                <button onClick={() => switchView(VIEWS.SIGN_IN)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-600 mb-5 transition-colors">
                  <ArrowLeft size={15} /> Back to sign in
                </button>
              )}

              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{heading}</h1>
                <p className="text-slate-500 mt-1.5 text-sm">{subheading}</p>
              </div>

              {/* ── ROLE SELECTION ─────────────────────────────────────── */}
              {view === VIEWS.ROLE && (
                <div className="space-y-4">
                  <RoleCard
                    role="customer"
                    icon={UserCheck}
                    title={lang === "bn" ? "আমি একজন রোগী" : "I'm a Patient"}
                    description={lang === "bn" ? "ডাক্তার খুঁজুন, অ্যাপয়েন্টমেন্ট বুক করুন এবং স্বাস্থ্য সেবা নিন।" : "Find doctors, book appointments, and get AI health insights."}
                    features={lang === "bn" ? ["৫০০+ যাচাইকৃত ডাক্তার খুঁজুন", "৬০ সেকেন্ডে বুক করুন", "প্রেসক্রিপশন ট্র্যাক করুন"] : ["Search 500+ verified doctors", "Book in under 60 seconds", "Track your health & prescriptions"]}
                    gradient="from-green-500 to-emerald-400"
                    selected={selectedRole === "customer"}
                    onSelect={() => setSelectedRole("customer")}
                  />
                  <RoleCard
                    role="doctor"
                    icon={Stethoscope}
                    title={lang === "bn" ? "আমি একজন ডাক্তার" : "I'm a Doctor"}
                    description={lang === "bn" ? "আপনার রোগী, সময়সূচি ও প্রেসক্রিপশন পরিচালনা করুন।" : "Manage your appointments, patients, and availability."}
                    features={lang === "bn" ? ["রোগীর দৈনিক তালিকা দেখুন", "প্রেসক্রিপশন প্রদান করুন", "উপলব্ধতা নির্ধারণ করুন"] : ["View your daily appointment queue", "Mark appointments as completed", "Toggle your availability status"]}
                    gradient="from-blue-500 to-indigo-500"
                    selected={selectedRole === "doctor"}
                    onSelect={() => setSelectedRole("doctor")}
                  />
                  <RoleCard
                    role="admin"
                    icon={ShieldCheck}
                    title={lang === "bn" ? "আমি একজন অ্যাডমিন" : "I'm an Admin"}
                    description={lang === "bn" ? "প্ল্যাটফর্মের ডাক্তার, সেবা ও কার্যক্রম নিয়ন্ত্রণ করুন।" : "Manage the MediPulse platform, doctors, and operations."}
                    features={lang === "bn" ? ["ডাক্তার ব্যবস্থাপনা", "বিশ্লেষণ ও রিপোর্ট", "নিরাপদ অ্যাডমিন অ্যাক্সেস"] : ["Full doctor CRUD management", "Platform analytics & oversight", "Secure admin-only access"]}
                    gradient="from-indigo-600 to-violet-600"
                    selected={selectedRole === "admin"}
                    onSelect={() => setSelectedRole("admin")}
                  />

                  {selectedRole && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                      <motion.button
                        whileHover={{ scale: 1.01, boxShadow: "0 12px 28px rgba(16,185,129,0.3)" }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => switchView(VIEWS.SIGN_UP, selectedRole)}
                        className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-2xl text-sm text-white shadow-lg transition-all ${
                          selectedRole === "admin" ? "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-200"
                          : selectedRole === "doctor" ? "bg-gradient-to-r from-blue-600 to-indigo-500 shadow-blue-200"
                          : "bg-gradient-to-r from-green-600 to-emerald-500 shadow-green-200"
                        }`}
                      >
                        {lang === "bn"
                          ? `${selectedRole === "admin" ? "অ্যাডমিন" : selectedRole === "doctor" ? "ডাক্তার" : "রোগী"} অ্যাকাউন্ট তৈরি করুন`
                          : `Create ${selectedRole === "admin" ? "Admin" : selectedRole === "doctor" ? "Doctor" : "Patient"} Account`} <Sparkles size={15} />
                      </motion.button>
                      <button onClick={() => switchView(VIEWS.SIGN_IN, selectedRole)}
                        className="w-full text-sm font-semibold text-slate-500 hover:text-green-600 transition-colors py-2">
                        {t("auth.haveAccount", "Already have an account?")} <span className="text-green-600 font-bold">{t("auth.signIn", "Sign in")} →</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── EMAIL VERIFY / FORGOT SUCCESS ─────────────────────── */}
              {view === VIEWS.VERIFY && (
                <div className="flex flex-col items-center text-center py-6 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-green-50 border border-green-100 flex items-center justify-center">
                    <Mail size={36} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-slate-700 font-bold">Email sent!</p>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs">
                      Check <strong>{email}</strong> for a verification or reset link.
                    </p>
                  </div>
                  <button onClick={() => switchView(VIEWS.SIGN_IN)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-green-500/25 hover:opacity-90 transition-opacity">
                    Back to Sign In <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* ── AUTH FORMS ────────────────────────────────────────── */}
              {(view === VIEWS.SIGN_IN || view === VIEWS.SIGN_UP || view === VIEWS.FORGOT) && (
                <>
                  {/* Role badge */}
                  {selectedRole && view !== VIEWS.FORGOT && (
                    <div className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-4 ${
                      selectedRole === "admin"   ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                      : selectedRole === "doctor" ? "bg-blue-50 text-blue-700 border border-blue-100"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    }`}>
                      {selectedRole === "admin" ? <ShieldCheck size={12} /> : selectedRole === "doctor" ? <Stethoscope size={12} /> : <UserCheck size={12} />}
                      {selectedRole === "admin" ? "Admin Account" : selectedRole === "doctor" ? "Doctor Account" : "Patient Account"}
                    </div>
                  )}

                  {/* Google OAuth (not for admin) */}
                  {view !== VIEWS.FORGOT && selectedRole !== "admin" && (
                    <div className="space-y-3 mb-6">
                      <motion.button type="button" onClick={handleGoogle} disabled={loading}
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-semibold py-3.5 rounded-2xl text-sm transition-all shadow-sm">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {t("auth.google", "Continue with Google")}
                      </motion.button>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-xs text-slate-400 font-medium">{t("auth.orContinueWith", "or")}</span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {/* Full Name */}
                    <AnimatePresence>
                      {view === VIEWS.SIGN_UP && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <Field id="fullName" label={t("auth.fullName", "Full Name")} placeholder="Your full name" value={fullName}
                            onChange={(e) => setFullName(e.target.value)} error={errors.fullName} autoComplete="name" required>
                            <User size={16} className="text-slate-400 ml-4 shrink-0" />
                          </Field>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Email */}
                    <Field id="email" label={t("auth.email", "Email Address")} type="email" placeholder="you@example.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" required>
                      <Mail size={16} className="text-slate-400 ml-4 shrink-0" />
                    </Field>

                    {/* Password */}
                    {view !== VIEWS.FORGOT && (
                      <div className="space-y-2">
                        <Field id="password" label={t("auth.password", "Password")}
                          type={showPw ? "text" : "password"}
                          placeholder={view === VIEWS.SIGN_UP ? "Min. 8 characters" : "Your password"}
                          value={password} onChange={(e) => setPassword(e.target.value)}
                          error={errors.password}
                          autoComplete={view === VIEWS.SIGN_UP ? "new-password" : "current-password"} required>
                          <Lock size={16} className="text-slate-400 ml-4 shrink-0" />
                          <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="mr-4 text-slate-400 hover:text-slate-600 transition-colors">
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </Field>
                        <AnimatePresence>
                          {view === VIEWS.SIGN_UP && password.length > 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
                              <div className="flex gap-1">
                                {[1,2,3,4,5].map(i => (
                                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= pwStrength.score ? STR_COLOR[pwStrength.score] : "bg-slate-200"}`} />
                                ))}
                              </div>
                              <p className="text-xs font-medium text-slate-500">Strength: <span className={`font-bold ${pwStrength.score <= 2 ? "text-red-500" : pwStrength.score === 3 ? "text-yellow-600" : "text-green-600"}`}>{STR_LABEL[pwStrength.score]}</span></p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Confirm Password */}
                    <AnimatePresence>
                      {view === VIEWS.SIGN_UP && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <Field id="confirmPw" label={t("auth.confirmPassword", "Confirm Password")}
                            type={showConfirmPw ? "text" : "password"} placeholder="Repeat your password"
                            value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} error={errors.confirmPw}
                            autoComplete="new-password" required>
                            <Lock size={16} className="text-slate-400 ml-4 shrink-0" />
                            <button type="button" tabIndex={-1} onClick={() => setShowConfirmPw(v => !v)} className="mr-4 text-slate-400 hover:text-slate-600 transition-colors">
                              {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </Field>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Admin Access Code */}
                    <AnimatePresence>
                      {view === VIEWS.SIGN_UP && selectedRole === "admin" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <Field id="adminKey" label="Admin Access Code"
                            type="password" placeholder="Enter the admin secret code"
                            value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
                            error={errors.adminKey} required>
                            <KeyRound size={16} className="text-slate-400 ml-4 shrink-0" />
                          </Field>
                          <p className="text-xs text-slate-400 mt-1">Contact your system administrator for this code.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Forgot link */}
                    {view === VIEWS.SIGN_IN && (
                      <div className="text-right">
                        <button type="button" onClick={() => switchView(VIEWS.FORGOT)}
                          className="text-xs text-green-600 hover:text-green-700 font-semibold transition-colors">
                          {t("auth.forgotPassword", "Forgot password?")}
                        </button>
                      </div>
                    )}

                    {/* Global error */}
                    <AnimatePresence>
                      {globalError && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="flex items-start gap-2.5 text-sm text-rose-700 bg-rose-50 border border-rose-200 px-4 py-3 rounded-2xl">
                          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {globalError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Terms */}
                    {view === VIEWS.SIGN_UP && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        By creating an account you agree to our{" "}
                        <a href="#" className="text-green-600 hover:underline font-semibold">Terms</a> and{" "}
                        <a href="#" className="text-green-600 hover:underline font-semibold">Privacy Policy</a>.
                      </p>
                    )}

                    {/* Submit button */}
                    <motion.button type="submit" disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.01, boxShadow: loading ? undefined : selectedRole === "admin" ? "0 12px 28px rgba(99,102,241,0.35)" : "0 12px 28px rgba(16,185,129,0.35)" }}
                      whileTap={{ scale: loading ? 1 : 0.99 }}
                      className={`w-full flex items-center justify-center gap-2.5 font-bold py-3.5 rounded-2xl text-sm text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2 ${
                        selectedRole === "admin"
                          ? "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-200"
                          : "bg-gradient-to-r from-green-600 to-emerald-500 shadow-green-200"
                      }`}
                    >
                      {loading ? (<><Loader2 size={17} className="animate-spin" /> Processing…</>)
                        : view === VIEWS.SIGN_IN ? (<>{t("auth.signIn", "Sign In")} <ArrowRight size={16} /></>)
                        : view === VIEWS.SIGN_UP ? (<>{t("auth.signUp", "Create Account")} <Sparkles size={16} /></>)
                        : (<>Send Reset Link <ArrowRight size={16} /></>)
                      }
                    </motion.button>
                  </form>

                  {/* Toggle sign in / sign up */}
                  {view !== VIEWS.FORGOT && (
                    <p className="text-center text-sm text-slate-500 mt-6">
                      {view === VIEWS.SIGN_IN ? (
                        <>{t("auth.noAccount", "Don't have an account?")}{" "}
                          <button onClick={() => switchView(VIEWS.SIGN_UP, selectedRole)} className="text-green-600 font-bold hover:text-green-700 transition-colors">Create one free</button>
                        </>
                      ) : (
                        <>{t("auth.haveAccount", "Already have an account?")}{" "}
                          <button onClick={() => switchView(VIEWS.SIGN_IN, selectedRole)} className="text-green-600 font-bold hover:text-green-700 transition-colors">{t("auth.signIn", "Sign in")}</button>
                        </>
                      )}
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Admin portal quick link */}
          <div className="mt-8 text-center">
            <Link to="/admin/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
              <KeyRound size={12} /> Returning admin? Use the admin portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
