import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseReady } from "../lib/supabaseClient";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseReady);
  const [authError, setAuthError] = useState(null);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let active = true,
      eventReceived = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      eventReceived = true;
      if (!active) return;
      setSession(next);
      setAuthReady(true);
      setAuthError(null);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") setRecovery(false);
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || eventReceived) return;
        setSession(data.session);
        setAuthError(error);
        setAuthReady(true);
      })
      .catch((error) => {
        if (active) {
          setAuthError(error);
          setAuthReady(true);
        }
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const requireClient = () => {
    if (!supabase) throw new Error("notConfigured");
  };
  const signUp = async ({ name, email, password }) => {
    requireClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  };
  const signIn = async ({ email, password }) => {
    requireClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    setSession(data.session);
    return data;
  };
  const signOut = async () => {
    requireClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
  };
  const resetPassword = async (email) => {
    requireClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) throw error;
  };
  const changePassword = async (password) => {
    requireClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setRecovery(false);
  };
  const resend = async (email) => {
    requireClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  };
  const value = useMemo(
    () => ({
      user: session?.user || null,
      session,
      authReady,
      authError,
      recovery,
      signUp,
      signIn,
      signOut,
      resetPassword,
      changePassword,
      resend,
    }),
    [session, authReady, authError, recovery],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
