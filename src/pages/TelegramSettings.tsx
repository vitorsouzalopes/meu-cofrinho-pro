import { useEffect, useState } from "react";
import { Bell, BellOff, Send, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { enableFcmPush, disableFcmPush } from "@/lib/fcm";
import { isFirebaseConfigured } from "@/constants/firebase";
import { Capacitor } from "@capacitor/core";

const NotificationsSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [fcmEnabled, setFcmEnabled] = useState(false);
  const [fcmBusy, setFcmBusy] = useState(false);
  const [fcmTokenCount, setFcmTokenCount] = useState(0);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { count } = await supabase
        .from("fcm_tokens" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setFcmTokenCount(count || 0);
      setFcmEnabled((count || 0) > 0);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleToggleFcm = async () => {
    if (!user) return;
    setFcmBusy(true);
    if (fcmEnabled) {
      await disableFcmPush(user.id);
      setFcmEnabled(false);
      setFcmTokenCount(0);
      toast({ title: "Notificações desativadas" });
    } else {
      const res = await enableFcmPush(user.id);
      if (res.ok) {
        setFcmEnabled(true);
        setFcmTokenCount((c) => c + 1);
        toast({ title: "✅ Notificações ativadas", description: "Você receberá alertas neste dispositivo." });
      } else {
        toast({ title: "Não foi possível ativar", description: res.reason, variant: "destructive" });
      }
    }
    setFcmBusy(false);
  };

  const triggerTest = async (title: string, body: string) => {
    if (!user) return;
    if (!fcmEnabled) {
      toast({ title: "Ative as notificações primeiro", variant: "destructive" });
      return;
    }
    toast({ title: "Enviando teste..." });
    try {
      const { data, error } = await supabase.functions.invoke("send-fcm", {
        body: { user_id: user.id, title, body, url: "/", force: true },
      });

      if (error) {
        console.error("FCM Test Error:", error);
        toast({
          title: "Erro na Edge Function",
          description: error.message || "A função retornou um erro inesperado.",
          variant: "destructive"
        });
        return;
      }

      if (!data?.ok) {
        toast({
          title: "Falha no Envio",
          description: data?.error || "O servidor não conseguiu processar o push.",
          variant: "destructive"
        });
      } else {
        toast({ title: "✅ Push enviado!" });
      }
    } catch (e: any) {
      console.error("FCM Exception:", e);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao servidor de notificações.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6 animate-slide-up">
        <Bell className="w-6 h-6 text-gold" />
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Notificações</h1>
          <p className="text-xs text-muted-foreground">Push nativo no seu dispositivo</p>
        </div>
      </div>

      <div className="glass-card p-5 mb-4 animate-slide-up">
        <h2 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2 mb-2">
          {fcmEnabled ? <Bell className="w-4 h-4 text-gold" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
          Push {isNative ? "Nativo (Android/iOS)" : "no Navegador (PWA)"}
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Receba alertas de progresso de desafios, salário, renda extra e lembretes de streak diretamente no dispositivo.
        </p>
        {!isNative && !isFirebaseConfigured() && (
          <div className="text-[11px] bg-amber-500/10 border border-amber-500/30 rounded p-2 mb-3 text-amber-700 dark:text-amber-300">
            ⚠️ Firebase não configurado para push web. No APK (Android) funciona nativamente.
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {isNative
              ? (fcmEnabled ? "Ativado no sistema" : "Toque para ativar")
              : (fcmEnabled ? `${fcmTokenCount} dispositivo(s) registrado(s)` : "Desativado")}
          </span>
          <Button
            size="sm"
            variant={fcmEnabled ? "outline" : "gold"}
            onClick={handleToggleFcm}
            disabled={fcmBusy || (!isNative && !isFirebaseConfigured())}
          >
            {fcmBusy ? "..." : fcmEnabled ? "Desativar" : "Ativar"}
          </Button>
        </div>
      </div>

      <div className="glass-card p-5 mb-4 animate-slide-up bg-amber-500/5 border-amber-500/10">
        <h2 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
          <Send className="w-4 h-4 text-amber-500" />
          Testar Notificações
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Envie um push de teste para validar a entrega.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => triggerTest("🚀 Push de Teste", "Se você recebeu isso, está tudo funcionando!")}
        >
          Enviar Push de Teste
        </Button>
      </div>

      {isNative && (
        <div className="glass-card p-4 animate-slide-up flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-emerald-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-foreground">App Nativo Detectado</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Você está usando o app instalado. As notificações usam o sistema nativo do dispositivo (FCM/APNS).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsSettings;
