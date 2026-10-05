import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setInstallEvent(null);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!visible || !installEvent) return null;

  const install = async () => {
    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setInstallEvent(null);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-md rounded-2xl border border-white/10 bg-[#111827]/95 p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4A017]/15 text-[#D4A017]">
          <Download className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">Instalar Cofrinho PRO</p>
          <p className="text-sm text-white/65">
            Tenha acesso rápido ao app direto pela tela inicial.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Fechar aviso de instalação"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={install}
        className="mt-3 w-full rounded-xl bg-[#D4A017] px-4 py-2.5 text-sm font-semibold text-[#0A0E1A] transition hover:brightness-110"
      >
        Instalar agora
      </button>
    </div>
  );
}
