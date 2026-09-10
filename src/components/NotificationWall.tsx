import { Bell, AlertCircle, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSettings, AndroidSettings } from 'capacitor-native-settings';
import { Capacitor } from '@capacitor/core';
import { useState } from "react";
import NotificationPermission from "@/lib/native-notification-permission";
import { useAuth } from "@/hooks/use-auth";

const NotificationWall = ({ onRetry }: { onRetry: () => void }) => {
  const [loading, setLoading] = useState(false);
  const { skipPush } = useAuth();

  const handleAction = async () => {
    if (!Capacitor.isNativePlatform()) {
      onRetry();
      return;
    }

    setLoading(true);
    try {
      // Use the custom bridge for real runtime dialog on Android 13+
      const { status } = await NotificationPermission.checkStatus();

      if (status === 'prompt') {
        const request = await NotificationPermission.requestPermission();
        console.log("[NotificationWall] Native dialog result:", request.status);
        // Always call onRetry to trigger a fresh check in AuthProvider
        onRetry();
      } else if (status === 'denied') {
        // If denied, they must go to settings
        await NativeSettings.open({
          option: AndroidSettings.AppDetails,
        });
      } else {
        // Already granted or other state, just retry to sync state
        onRetry();
      }
    } catch (err) {
      console.error("Wall action fail:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0E1A] flex items-center justify-center p-6 overflow-y-auto">
      {/* Skip Button */}
      <button
        onClick={skipPush}
        className="absolute top-8 right-6 p-2 text-muted-foreground/60 hover:text-white transition-colors"
        aria-label="Continuar sem notificações"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-sm space-y-8 text-center py-10">
        <div className="relative mx-auto w-24 h-24">
           <div className="absolute inset-0 bg-[#D4A017]/20 rounded-full animate-ping" />
           <div className="relative w-24 h-24 rounded-full bg-[#16213e] border-4 border-[#D4A017] flex items-center justify-center shadow-2xl">
              <Bell className="w-12 h-12 text-[#D4A017]" />
           </div>
           <div className="absolute -top-1 -right-1 w-8 h-8 bg-destructive rounded-full flex items-center justify-center border-4 border-[#0A0E1A]">
              <AlertCircle className="w-4 h-4 text-white" />
           </div>
        </div>

        <div className="space-y-3 px-2">
          <h1 className="text-2xl font-bold text-white">Lembretes Ativos</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Recomendamos ativar as notificações para você nunca esquecer de uma conta ou meta importante.
          </p>
        </div>

        <Card className="p-6 bg-[#D4A017]/5 border-[#D4A017]/20 text-left space-y-4 mx-2">
           <p className="text-[10px] font-bold text-[#D4A017] uppercase tracking-widest">Benefícios</p>
           <ul className="space-y-3">
              <li className="text-xs text-white/90 flex items-start gap-3">
                 <div className="w-2 h-2 rounded-full bg-[#D4A017] mt-1 shrink-0" />
                 <span>Avisos 3 dias antes do vencimento.</span>
              </li>
              <li className="text-xs text-white/90 flex items-start gap-3">
                 <div className="w-2 h-2 rounded-full bg-[#D4A017] mt-1 shrink-0" />
                 <span>Resumos de fechamento de mês.</span>
              </li>
              <li className="text-xs text-white/90 flex items-start gap-3">
                 <div className="w-2 h-2 rounded-full bg-[#D4A017] mt-1 shrink-0" />
                 <span>Alertas de segurança nas suas metas.</span>
              </li>
           </ul>
        </Card>

        <div className="space-y-4 px-2">
          <Button
            className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-[#D4A017]/20 bg-[#D4A017] hover:bg-[#B8860B] text-[#0A0E1A]"
            onClick={handleAction}
            disabled={loading}
          >
            {loading ? "Verificando..." : "Ativar Notificações"}
            {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
          </Button>

          <button
            onClick={skipPush}
            className="text-[10px] text-muted-foreground uppercase tracking-widest hover:text-white transition-colors"
          >
            Continuar sem notificações (não recomendado)
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationWall;
