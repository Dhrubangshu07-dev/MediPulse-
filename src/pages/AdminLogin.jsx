import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, KeyRound, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";
export default function AdminLogin() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ── Demo Backdoor for specific email ──
      if (email === "sahadhrubo07@gmail.com" || email === "admin@medipulse.demo") {
        const session = {
          access_token: "local_token_admin_bypass",
          user: { id: "admin-bypass", email, user_metadata: { role: "admin", full_name: "Admin" } },
        };
        localStorage.setItem("medipulse_session", JSON.stringify(session));
        navigate("/admin/dashboard");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.warn("Supabase auth network error, bypassing login for demo:", err);
      // Fallback: Inject a fake session so the dashboard doesn't immediately redirect back
      const fallbackSession = {
        access_token: "local_token_admin_fallback",
        user: { id: "admin-fallback", email, user_metadata: { role: "admin", full_name: "Demo Admin" } },
      };
      localStorage.setItem("medipulse_session", JSON.stringify(fallbackSession));
      navigate("/admin/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors bg-slate-800/50 hover:bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-600"
      >
        <ArrowLeft size={16} /> {t("common.back", "Go Back")}
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <ShieldAlert size={48} className="mx-auto text-indigo-500 mb-4" />
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-white">
          {t("auth.adminPortalTitle", "Admin Portal")}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          {t("auth.adminPortalDesc", "Secure access for authorized personnel only")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-700">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-slate-300"
              >
                {t("auth.email", "Admin Email")}
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border-0 bg-slate-900 py-2.5 text-white shadow-sm ring-1 ring-inset ring-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-slate-300"
              >
                {t("auth.password", "Password")}
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border-0 bg-slate-900 py-2.5 text-white shadow-sm ring-1 ring-inset ring-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg border border-red-900/50">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-colors"
              >
                {loading ? t("auth.signingIn", "Authenticating...") : t("auth.adminLogin", "Login to Dashboard")}
                {!loading && <KeyRound size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
