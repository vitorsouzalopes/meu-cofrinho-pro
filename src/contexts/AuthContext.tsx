import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
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
  checkPushPermission: (force?: boolean) => Promise<void>;
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

  const checkingPushRef = useRef(false);

  const checkPushPermission = useCallback(async (force = false) => {
    if (!user) return;
    if (!force && (pushChecked || checkingPushRef.current)) return;

    if (!Capacitor.isNativePlatform()) {
      setPushStatus('web');
      setPushChecked(true);
      return;
    }

    console.log("[AuthContext] Requesting push check...");
    checkingPushRef.current = true;

    // Safety Timeout: Proceed after 3s to avoid total app hang
    const timeout = setTimeout(() => {
      if (!pushChecked) {
        console.warn("[AuthContext] Push check safety timeout.");
        setPushStatus('timeout');
        setPushChecked(true);
        checkingPushRef.current = false;
      }
    }, 3000);

    try {
      const res = await registerNativePush(user.id);
      clearTimeout(timeout);
      setPushStatus(res.status);
    } catch (e) {
      console.error("[AuthContext] Push registration failed:", e);
      setPushStatus('error');
    } finally {
      setPushChecked(true);
      checkingPushRef.current = false;
    }
  }, [user, pushChecked]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);

      const nextUser = session?.user ?? null;
      setUser(prev => (prev?.id === nextUser?.id && prev?.email === nextUser?.email) ? prev : nextUser);

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
        checkingPushRef.current = false;
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Run push check once user is loaded
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
