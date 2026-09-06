import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

/**
 * Role is stored in user_metadata at sign-up time.
 * Possible values: "customer" | "admin"
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // Supabase User object
  const [role, setRole]       = useState(null);   // "customer" | "admin" | null
  const [loading, setLoading] = useState(true);   // true until first session check done

  /** Extract role from user metadata (set during signUp) */
  const extractRole = useCallback((u) => {
    if (!u) return null;
    return u.user_metadata?.role ?? "customer"; // default to customer
  }, []);

  /** Refresh user state from current session */
  const syncUser = useCallback((session) => {
    const u = session?.user ?? null;
    setUser(u);
    setRole(extractRole(u));
  }, [extractRole]);

  useEffect(() => {
    // 1. Read existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser(session);
      setLoading(false);
    });

    // 2. Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        syncUser(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [syncUser]);

  // ── Auto Logout on Inactivity (15 mins, throttled to avoid CPU lag) ────────
  useEffect(() => {
    let timeoutId;
    let lastReset = Date.now();
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (user) {
        timeoutId = setTimeout(() => {
          console.log("Logged out due to inactivity");
          supabase.auth.signOut().then(() => {
            window.location.href = "/login"; // redirect to login
          });
        }, INACTIVITY_LIMIT);
      }
    };

    // Throttle activity checks so mousemove doesn't fire 120 times/sec
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastReset > 15000) { // update at most once every 15s
        lastReset = now;
        resetTimer();
      }
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    // Only attach listeners if logged in
    if (user) {
      resetTimer(); // start timer immediately
      events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, [user]);

  // ── Auth actions ─────────────────────────────────────────────────────────────

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email, password, fullName, selectedRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: selectedRole,        // stored in auth.users.raw_user_meta_data
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
  }, []);

  const isAdmin    = role === "admin";
  const isCustomer = role === "customer";
  const isLoggedIn = !!user;

  const value = {
    user,
    role,
    loading,
    isAdmin,
    isCustomer,
    isLoggedIn,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
