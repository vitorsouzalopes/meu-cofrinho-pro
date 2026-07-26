import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    console.log("[Auth] Provider mounted, fetching session...");

    // Fetch initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        console.log("[Auth] Session fetched:", session ? "Active" : "None");
        setSession(session);
        setUser(session?.user ?? null);
        // ... (role check omitted for brevity in targetContent match, will re-read)


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
      })
      .catch((err) => {
        console.error("Auth getSession error:", err);
      })
      .finally(() => {
        // Always stop loading, even on network failure
        if (isMounted) setLoading(false);
      });

    // Listen for future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (isMounted) setLoading(false);

        if (session?.user) {
          // Non-blocking role check — never await inside onAuthStateChange
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
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
