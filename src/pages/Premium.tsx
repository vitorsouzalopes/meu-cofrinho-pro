import { Crown, Bell, Target, Users, Sparkles, ShieldCheck, Check, History, Database, FileText, Zap, MegaphoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const features = [
  { icon: MegaphoneOff, title: "Sem Anúncios", desc: "Experiência limpa e focada no seu dinheiro" },
  { icon: Database, title: "Backup na Nuvem", desc: "Seus dados seguros e sincronizados sempre" },
  { icon: FileText, title: "Relatórios Full", desc: "Exportação detalhada em PDF e Excel" },
  { icon: Sparkles, title: "Consultor IA", desc: "Análise ilimitada de compras e gastos" },
  { icon: Zap, title: "Planejamento Pro", desc: "Simulações avançadas de quitação de dívidas" },
  { icon: History, title: "Histórico Infinito", desc: "Acesso a todo o seu passado financeiro" },
  { icon: Bell, title: "Alertas Inteligentes", desc: "Notificações personalizadas de risco e metas" },
];

const Premium = () => {
  const { toast } = useToast();

  const handleSubscribe = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Em breve você poderá assinar o Premium diretamente no app!",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Hero */}
      <div className="text-center mb-8 animate-slide-up">
        <div className="w-16 h-16 rounded-2xl gradient-gold glow-gold flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Cofrinho Pro Premium</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Desbloqueie todo o potencial da sua jornada financeira.
        </p>
      </div>

      {/* Price */}
      <div className="glass-card p-6 mb-6 text-center glow-gold animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <p className="text-muted-foreground text-sm">A partir de</p>
        <div className="flex items-baseline justify-center gap-1 mt-1">
          <span className="font-heading text-4xl font-bold text-gold">R$9</span>
          <span className="text-gold font-heading text-xl">,90</span>
          <span className="text-muted-foreground text-sm">/mês</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Cancele quando quiser</p>
      </div>

      {/* Features */}
      <div className="space-y-3 mb-6">
        {features.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="glass-card p-4 flex items-start gap-3 animate-slide-up"
            style={{ animationDelay: `${(i + 2) * 0.1}s` }}
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Check className="w-4 h-4 text-emerald-accent flex-shrink-0 mt-1" />
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button variant="gold" className="w-full h-12 text-base font-heading font-bold" onClick={handleSubscribe}>
        Assinar Premium <Crown className="w-5 h-5" />
      </Button>
      <p className="text-center text-[10px] text-muted-foreground mt-3">
        7 dias grátis para experimentar • Sem compromisso
      </p>
    </div>
  );
};

export default Premium;
