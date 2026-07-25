import { Bell, ShieldAlert, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { Capacitor } from '@capacitor/core';

const NotificationWall = ({ onRetry }: { onRetry: () => void }) => {
  const openSettings = async () => {
    if (Capacitor.isNativePlatform()) {
      await NativeSettings.open({
        option: AndroidSettings.AppDetails, // Direct to app notification settings if possible
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="relative mx-auto w-24 h-24">
           <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
           <div className="relative w-24 h-24 rounded-full bg-card border-4 border-primary flex items-center justify-center shadow-2xl">
              <Bell className="w-12 h-12 text-primary" />
           </div>
           <div className="absolute -top-1 -right-1 w-8 h-8 bg-destructive rounded-full flex items-center justify-center border-4 border-card">
              <ShieldAlert className="w-4 h-4 text-white" />
           </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Notificações Obrigatórias</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para garantir a precisão do seu planejamento e o controle total do seu Cofrinho PRO, as notificações push são **obrigatórias**.
          </p>
        </div>

        <Card className="p-6 bg-primary/5 border-primary/20 text-left space-y-4">
           <p className="text-xs font-bold text-primary uppercase tracking-widest">Por que é necessário?</p>
           <ul className="space-y-2">
              <li className="text-xs text-foreground/80 flex items-start gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                 Lembretes de vencimento de contas.
              </li>
              <li className="text-xs text-foreground/80 flex items-start gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                 Alertas de risco financeiro pela IA.
              </li>
              <li className="text-xs text-foreground/80 flex items-start gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                 Confirmação de depósitos em metas.
              </li>
           </ul>
        </Card>

        <div className="space-y-3">
          <Button className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20" onClick={openSettings}>
            Ativar nas Configurações <Settings className="ml-2 w-5 h-5" />
          </Button>
          <Button variant="ghost" className="w-full" onClick={onRetry}>
            Já ativei, tentar novamente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationWall;
