import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  pushStatus: string | null;
  pushChecked: boolean;
  signOut: () => Promise<void>;
  checkPushPermission: (force?: boolean) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  loading: true,
  pushStatus: null,
  pushChecked: false,
  signOut: async () => {},
  checkPushPermission: async () => {},
});

export const useAuth = () => useContext(AuthContext);

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

    console.log("[AuthContext] Checking push permission...");
    checkingPushRef.current = true;

    try {
      // DYNAMIC IMPORT to avoid circular dependencies and TDZ
      const { registerNativePush } = await import("@/lib/native-push");
      const res = await registerNativePush(state.user.id);
      setState(prev => ({ ...prev, pushStatus: res.status, pushChecked: true }));
    } catch (e) {
      console.error("[AuthContext] Push check failed:", e);
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        const isAdmin = session?.user ? await checkAdmin(session.user.id) : false;

        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isAdmin,
          loading: false
        }));
      } catch (err) {
        console.error("[AuthContext] Init error:", err);
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

  // Trigger push check after user is stable
  useEffect(() => {
    if (state.user && !state.pushChecked && !state.loading) {
      const t = setTimeout(() => {
        checkPushPermission();
      }, 1000);
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
