import { useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<{
    session: Session | null;
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    pushStatus: string | null;
    pushChecked: boolean;
  }>({
    session: null,
    user: null,
    isAdmin: false,
    loading: true,
    pushStatus: null,
    pushChecked: false,
  });

  const checkingPushRef = useRef(false);

  const checkPushPermission = useCallback(async (force = false) => {
    if (!state.user) return;
    if (!force && (state.pushChecked || checkingPushRef.current)) return;

    if (!Capacitor.isNativePlatform()) {
      setState(prev => ({ ...prev, pushStatus: 'web', pushChecked: true }));
      return;
    }

    console.log("[AuthProvider] Checking push permission...");
    checkingPushRef.current = true;

    try {
      // Dynamic import to avoid TDZ/Circular dependency during auth state change
      const { registerNativePush } = await import("@/lib/native-push");
      const res = await registerNativePush(state.user.id);
      setState(prev => ({ ...prev, pushStatus: res.status, pushChecked: true }));
    } catch (e) {
      console.error("[AuthProvider] Push check failed:", e);
      setState(prev => ({ ...prev, pushStatus: 'error', pushChecked: true }));
    } finally {
      checkingPushRef.current = false;
    }
  }, [state.user, state.pushChecked]);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        return !!data;
      } catch {
        return false;
      }
    };

    const initSession = async () => {
      try {
        console.log("[AuthProvider] Calling getSession...");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[AuthProvider] Session received:", !!session);
        if (!isMounted) return;

        const isAdmin = session?.user ? await checkAdmin(session.user.id) : false;
        console.log("[AuthProvider] Is admin:", isAdmin);

        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isAdmin,
          loading: false
        }));
      } catch (err) {
        console.error("[AuthProvider] Init error:", err);
        if (isMounted) setState(prev => ({ ...prev, loading: false }));
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      const isAdmin = session?.user ? await checkAdmin(session.user.id) : false;

      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isAdmin,
        loading: false,
        pushChecked: session ? prev.pushChecked : false,
        pushStatus: session ? prev.pushStatus : null
      }));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (state.user && !state.pushChecked && !state.loading) {
      const t = setTimeout(() => {
        checkPushPermission();
      }, 1500); // Wait for app to be stable
      return () => clearTimeout(t);
    }
  }, [state.user, state.pushChecked, state.loading, checkPushPermission]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      signOut,
      checkPushPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};
