import { Bell, ShieldAlert, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSettings, AndroidSettings } from 'capacitor-native-settings';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useState } from "react";

const NotificationWall = ({ onRetry }: { onRetry: () => void }) => {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!Capacitor.isNativePlatform()) {
      onRetry();
      return;
    }

    setLoading(true);
    try {
      const permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        const request = await PushNotifications.requestPermissions();
        if (request.receive === 'granted') {
          onRetry();
        }
      } else if (permStatus.receive === 'denied') {
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
      <div className="w-full max-w-sm space-y-8 text-center py-10">
        <div className="relative mx-auto w-24 h-24">
           <div className="absolute inset-0 bg-[#D4A017]/20 rounded-full animate-ping" />
           <div className="relative w-24 h-24 rounded-full bg-[#16213e] border-4 border-[#D4A017] flex items-center justify-center shadow-2xl">
              <Bell className="w-12 h-12 text-[#D4A017]" />
           </div>
           <div className="absolute -top-1 -right-1 w-8 h-8 bg-destructive rounded-full flex items-center justify-center border-4 border-[#0A0E1A]">
              <ShieldAlert className="w-4 h-4 text-white" />
           </div>
        </div>

        <div className="space-y-3 px-2">
          <h1 className="text-2xl font-bold text-white">Acesso Obrigatório</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para garantir que você nunca perca o vencimento de uma conta, as notificações são **obrigatórias** no Cofrinho PRO.
          </p>
        </div>

        <Card className="p-6 bg-[#D4A017]/5 border-[#D4A017]/20 text-left space-y-4 mx-2">
           <p className="text-[10px] font-bold text-[#D4A017] uppercase tracking-widest">O que você ganha ativando?</p>
           <ul className="space-y-3">
              <li className="text-xs text-white/90 flex items-start gap-3">
                 <div className="w-2 h-2 rounded-full bg-[#D4A017] mt-1 shrink-0" />
                 <span>Lembretes inteligentes de vencimento.</span>
              </li>
              <li className="text-xs text-white/90 flex items-start gap-3">
                 <div className="w-2 h-2 rounded-full bg-[#D4A017] mt-1 shrink-0" />
                 <span>Alertas de risco financeiro da IA.</span>
              </li>
              <li className="text-xs text-white/90 flex items-start gap-3">
                 <div className="w-2 h-2 rounded-full bg-[#D4A017] mt-1 shrink-0" />
                 <span>Segurança em tempo real nas suas metas.</span>
              </li>
           </ul>
        </Card>

        <div className="space-y-4 px-2">
          <Button
            className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-[#D4A017]/20 bg-[#D4A017] hover:bg-[#B8860B] text-[#0A0E1A]"
            onClick={handleAction}
            disabled={loading}
          >
            {loading ? "Verificando..." : "Ativar Notificações AGORA"}
            {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
          </Button>

          <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 leading-relaxed">
            Se você já ativou nas configurações do sistema, tente clicar no botão acima para validar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationWall;
