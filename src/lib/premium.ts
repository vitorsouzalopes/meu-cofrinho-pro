import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Hook simples para checar status Premium.
 *
 * NOTA (scaffold): ainda não há provedor de pagamento integrado.
 * Fonte da verdade: coluna `is_premium` em `profiles` (default false).
 * Quando integrarmos Stripe/Paddle, o webhook do provedor atualiza essa coluna.
 *
 * Admins são considerados Premium automaticamente para permitir testes.
 */
export function usePremium() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [profRes, roleRes] = await Promise.all([
          supabase.from("profiles").select("is_premium").eq("id", user.id).maybeSingle(),
          supabase.from("user_roles" as any).select("role").eq("user_id", user.id).maybeSingle(),
        ]);
        if (cancelled) return;
        const premiumFlag = (profRes.data as any)?.is_premium === true;
        const isAdmin = (roleRes.data as any)?.role === "admin";
        setIsPremium(premiumFlag || isAdmin);
      } catch {
        if (!cancelled) setIsPremium(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  return { isPremium, loading };
}
