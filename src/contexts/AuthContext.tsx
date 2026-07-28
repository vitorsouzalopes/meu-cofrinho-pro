import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { registerNativePush } from "@/lib/native-push";
import { Capacitor } from "@capacitor/core";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  pushStatus: string | null;
  pushChecked: boolean;
  signOut: () => Promise<void>;
  checkPushPermission: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [pushChecked, setPushChecked] = useState(false);

  const checkPushPermission = useCallback(async () => {
    if (!user) return;
    if (!Capacitor.isNativePlatform()) {
      setPushStatus('web');
      setPushChecked(true);
      return;
    }

    console.log("[AuthContext] Checking push permission...");

    // Safety Timeout: Force proceed after 2.5 seconds
    const safetyTimeout = setTimeout(() => {
      if (!pushChecked) {
        console.warn("[AuthContext] Push check timed out (2.5s). Forcing completion.");
        setPushStatus('timeout');
        setPushChecked(true);
      }
    }, 2500);

    try {
      const res = await registerNativePush(user.id);
      clearTimeout(safetyTimeout);
      setPushStatus(res.status);
      console.log("[AuthContext] Push status received:", res.status);
    } catch (e) {
      console.error("[AuthContext] Push check error:", e);
      setPushStatus('error');
    } finally {
      setPushChecked(true);
    }
  }, [user, pushChecked]);

  useEffect(() => {
    let isMounted = true;
    console.log("[AuthContext] Provider mounting...");

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      console.log("[AuthContext] Session checked:", session ? "Active" : "None");
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle()
          .then(({ data }) => {
            if (isMounted) setIsAdmin(!!data);
          });
      }
    }).catch(err => {
      console.error("[AuthContext] Session fetch error:", err);
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      console.log("[AuthContext] Auth state changed:", _event, session ? "User active" : "No user");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle()
          .then(({ data }) => {
            if (isMounted) setIsAdmin(!!data);
          });
      } else {
        setIsAdmin(false);
        setPushChecked(false);
        setPushStatus(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Background check once user is loaded - does NOT block UI anymore
  useEffect(() => {
    if (user && !pushChecked) {
      checkPushPermission();
    }
  }, [user, pushChecked, checkPushPermission]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session, user, isAdmin, loading,
      pushStatus, pushChecked, checkPushPermission,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
