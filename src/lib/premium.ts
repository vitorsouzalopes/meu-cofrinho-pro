import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type PremiumSubscription = null;

/**
 * Hook para checar acesso Premium e disponibilizar os dados da assinatura.
 *
 * Fonte atual da autorização: profiles.is_premium + admin.
 * A assinatura persistida é somente metadado até o webhook do provedor
 * passar a atualizar a autorização de forma confiável.
 */
export function usePremium() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setSubscription(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [profRes, roleRes] = await Promise.all([
          supabase.from("profiles").select("is_premium").eq("id", user.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
        ]);

        if (cancelled) return;

        const premiumFlag = profRes.data?.is_premium === true;
        const isAdmin = roleRes.data?.role === "admin";

        setIsPremium(premiumFlag || isAdmin);
        setSubscription(null);
      } catch {
        if (!cancelled) {
          setIsPremium(false);
          setSubscription(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { isPremium, subscription, loading };
}
