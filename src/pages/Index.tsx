import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProgressRing from "@/components/ProgressRing";
import StreakBadge from "@/components/StreakBadge";
import LevelBar from "@/components/LevelBar";
import { Button } from "@/components/ui/button";
import { mockStats, mockProgress, challenges } from "@/data/challenges";
import { ArrowRight, TrendingUp, Wallet, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Index = () => {
  const navigate = useNavigate();
  const currentChallenge = challenges.find((c) => c.id === mockProgress.challengeId)!;
  const progress = Math.round((mockProgress.completedDays.length / 30) * 100);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const appInstalledHandler = () => setInstalled(true);
    
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", appInstalledHandler);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Cofrinho <span className="text-gold">PRO</span></h1>
          <p className="text-xs text-muted-foreground">Sua jornada financeira inteligente</p>
        </div>
        <StreakBadge streak={mockStats.currentStreak} />
      </div>

      {/* Balance Card */}
      <div className="glass-card p-6 mb-4 glow-gold animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-gold" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Saldo Guardado</span>
        </div>
        <p className="font-heading text-3xl font-bold text-gold">
          R$ {mockStats.totalSaved.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-accent" />
          <span className="text-xs text-emerald-accent font-medium">+R$25,00 esta semana</span>
        </div>
      </div>

      {/* Current Challenge */}
      <div className="glass-card p-5 mb-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Desafio Atual</p>
            <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
              {currentChallenge.icon} {currentChallenge.title}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <ProgressRing progress={progress} size={100} strokeWidth={6}>
            <div className="text-center">
              <p className="font-heading text-xl font-bold text-foreground">{progress}%</p>
              <p className="text-[10px] text-muted-foreground">completo</p>
            </div>
          </ProgressRing>
          <div className="flex-1 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dias concluídos</span>
              <span className="font-semibold text-foreground">{mockProgress.completedDays.length}/30</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total guardado</span>
              <span className="font-semibold text-gold">R${mockProgress.totalSaved}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Meta</span>
              <span className="font-semibold text-foreground">R${currentChallenge.targetAmount}</span>
            </div>
          </div>
        </div>
        <Button variant="gold" className="w-full mt-4" onClick={() => navigate("/progress")}>
          Ver Progresso <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Level */}
      <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <LevelBar level={mockStats.level} xp={mockStats.xp} xpToNextLevel={mockStats.xpToNextLevel} />
      </div>

      {/* Medals */}
      <div className="glass-card p-4 mt-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <h3 className="font-heading font-semibold text-foreground text-sm mb-3">Conquistas</h3>
        <div className="flex gap-3">
          {mockStats.medals.map((medal, i) => (
            <div key={i} className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-xl">
              {medal}
            </div>
          ))}
          <div className="w-12 h-12 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
            ?
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 animate-slide-up" style={{ animationDelay: "0.5s" }}>
        <Button variant="emerald" className="w-full" onClick={() => navigate("/challenges")}>
          Explorar Desafios <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* PWA Install */}
      {deferredPrompt && !installed && (
        <div className="mt-3 animate-slide-up" style={{ animationDelay: "0.6s" }}>
          <Button variant="outline" className="w-full" onClick={handleInstall}>
            <Download className="w-4 h-4 mr-2" /> Instalar o App no Dispositivo
          </Button>
        </div>
      )}
      {!deferredPrompt && !installed && (
        <div className="mt-3 animate-slide-up" style={{ animationDelay: "0.6s" }}>
          <Button variant="outline" className="w-full" onClick={() => navigate("/download")}>
            <Download className="w-4 h-4 mr-2" /> Como instalar o App
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;
