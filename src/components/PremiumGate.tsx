import { ReactNode } from "react";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/lib/premium";

interface PremiumGateProps {
  children: ReactNode;
  /** Título exibido no bloqueio */
  title?: string;
  /** Descrição do recurso premium */
  description?: string;
  /** Se true, renderiza um overlay borrado; se false, substitui completamente */
  blur?: boolean;
}

/**
 * Envolve um recurso Premium. Se o usuário não for Premium, mostra CTA para /premium.
 *
 * Uso:
 *   <PremiumGate title="Relatórios Avançados">
 *     <RelatorioAvancado />
 *   </PremiumGate>
 */
const PremiumGate = ({ children, title = "Recurso Premium", description = "Assine o Premium para desbloquear.", blur = false }: PremiumGateProps) => {
  const { isPremium, loading } = usePremium();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-[120px] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPremium) return <>{children}</>;

  if (blur) {
    return (
      <div className="relative">
        <div className="pointer-events-none blur-sm opacity-40 select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <PremiumCTA title={title} description={description} onClick={() => navigate("/premium")} />
        </div>
      </div>
    );
  }

  return <PremiumCTA title={title} description={description} onClick={() => navigate("/premium")} />;
};

const PremiumCTA = ({ title, description, onClick }: { title: string; description: string; onClick: () => void }) => (
  <div className="glass-card p-6 text-center max-w-sm mx-auto">
    <div className="w-12 h-12 rounded-2xl gradient-gold glow-gold flex items-center justify-center mx-auto mb-3">
      <Lock className="w-6 h-6 text-primary-foreground" />
    </div>
    <h3 className="font-heading font-bold text-foreground mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground mb-4">{description}</p>
    <Button variant="gold" size="sm" onClick={onClick} className="w-full">
      <Crown className="w-4 h-4 mr-2" /> Desbloquear Premium
    </Button>
  </div>
);

export default PremiumGate;
