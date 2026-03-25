import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, Share2, Plus, MoreVertical, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type Platform = "ios" | "android" | "desktop" | "unknown";

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DownloadPage = () => {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  const iosSteps = [
    { icon: <Share2 className="w-5 h-5" />, text: 'Toque no ícone de Compartilhar na barra do Safari' },
    { icon: <Plus className="w-5 h-5" />, text: '"Adicionar à Tela de Início"' },
    { icon: <Check className="w-5 h-5" />, text: 'Toque em "Adicionar" para confirmar' },
  ];

  const androidSteps = [
    { icon: <MoreVertical className="w-5 h-5" />, text: 'Toque no menu (⋮) do Chrome' },
    { icon: <Download className="w-5 h-5" />, text: '"Instalar aplicativo" ou "Adicionar à tela inicial"' },
    { icon: <Check className="w-5 h-5" />, text: 'Confirme a instalação' },
  ];

  return (
    <div className="min-h-screen px-4 pt-8 pb-12 max-w-lg mx-auto flex flex-col">
      {/* Hero */}
      <div className="text-center mb-8 animate-slide-up">
        <div className="w-20 h-20 rounded-2xl gradient-gold mx-auto mb-4 flex items-center justify-center shadow-lg">
          <span className="text-3xl">🐷</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Baixe o Cofrinho Pro</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Instale o app no seu dispositivo para acesso rápido, notificações e experiência completa — sem loja de apps!
        </p>
      </div>

      {installed && (
        <div className="glass-card p-4 mb-6 border border-emerald-accent/30 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-accent/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-accent" />
            </div>
            <div>
              <p className="font-heading font-semibold text-foreground text-sm">App instalado!</p>
              <p className="text-xs text-muted-foreground">Abra pela tela inicial do seu dispositivo.</p>
            </div>
          </div>
        </div>
      )}

      {/* Install button (Chrome/Edge desktop & Android) */}
      {deferredPrompt && !installed && (
        <div className="animate-slide-up mb-6">
          <Button variant="gold" className="w-full text-base py-6" onClick={handleInstall}>
            <Download className="w-5 h-5 mr-2" /> Instalar Agora
          </Button>
        </div>
      )}

      {/* Platform tabs */}
      <div className="space-y-4">
        {/* Mobile Card */}
        <div className={`glass-card p-5 animate-slide-up ${platform !== "desktop" ? "glow-gold" : ""}`} style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-foreground">Celular</h2>
              <p className="text-xs text-muted-foreground">iPhone & Android</p>
            </div>
            {platform !== "desktop" && (
              <span className="ml-auto text-[10px] uppercase tracking-wider text-gold font-semibold bg-primary/10 px-2 py-1 rounded-full">
                Seu dispositivo
              </span>
            )}
          </div>

          {/* iOS instructions */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">iPhone (Safari)</p>
            <div className="space-y-3">
              {iosSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-gold">
                    {step.icon}
                  </div>
                  <div className="flex items-center gap-2 pt-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">{i + 1}.</span>
                    <p className="text-sm text-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border/50 pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Android (Chrome)</p>
            <div className="space-y-3">
              {androidSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-gold">
                    {step.icon}
                  </div>
                  <div className="flex items-center gap-2 pt-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">{i + 1}.</span>
                    <p className="text-sm text-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Card */}
        <div className={`glass-card p-5 animate-slide-up ${platform === "desktop" ? "glow-gold" : ""}`} style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-foreground">Computador</h2>
              <p className="text-xs text-muted-foreground">Chrome, Edge & Brave</p>
            </div>
            {platform === "desktop" && (
              <span className="ml-auto text-[10px] uppercase tracking-wider text-gold font-semibold bg-primary/10 px-2 py-1 rounded-full">
                Seu dispositivo
              </span>
            )}
          </div>

          <div className="space-y-3">
            {[
              { icon: <Monitor className="w-5 h-5" />, text: "Abra o site no Chrome, Edge ou Brave" },
              { icon: <Download className="w-5 h-5" />, text: 'Clique no ícone de instalar (⊕) na barra de endereço' },
              { icon: <Check className="w-5 h-5" />, text: 'Clique em "Instalar" na janela que aparecer' },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-gold">
                  {step.icon}
                </div>
                <div className="flex items-center gap-2 pt-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">{i + 1}.</span>
                  <p className="text-sm text-foreground">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="glass-card p-5 mt-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h3 className="font-heading font-semibold text-foreground text-sm mb-3">Por que instalar?</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: "⚡", text: "Acesso rápido" },
            { emoji: "📱", text: "Tela cheia" },
            { emoji: "🔔", text: "Notificações" },
            { emoji: "📶", text: "Funciona offline" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-lg">{f.emoji}</span>
              <span className="text-muted-foreground">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Back to app */}
      <div className="mt-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
          Voltar ao App <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default DownloadPage;
