import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Sparkles, Send, Bot, User, ShieldCheck, AlertCircle, XCircle, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calcularTotaisFinanceiros, resolverContasDoMes } from "@/lib/finance-utils";
import { usePremium } from "@/lib/premium";
import { cn } from "@/lib/utils";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Message {
  role: "bot" | "user";
  content: string;
  type?: "success" | "warning" | "error" | "neutral";
}

const AIConsultant = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremium();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Olá! Sou seu Consultor Cofrinho Pro. Posso te ajudar a decidir se uma compra cabe no seu orçamento ou analisar sua saúde financeira. O que você gostaria de saber?",
      type: "neutral"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [financeData, setFinanceData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const today = new Date();
    const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    const [resInst, resTemp, resSal, resExtra, resGoals, resDebts] = await Promise.all([
      supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false).eq("month_year", currentMonthYear),
      supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", true),
      supabase.from("salary" as any).select("*").eq("user_id", user.id).eq("month_year", currentMonthYear).maybeSingle(),
      supabase.from("extra_income").select("*").eq("user_id", user.id).eq("month_year", currentMonthYear),
      supabase.from("goals" as any).select("*").eq("user_id", user.id),
      supabase.from("debts" as any).select("*").eq("user_id", user.id),
    ]);

    const resolved = resolverContasDoMes(resInst.data || [], resTemp.data || [], currentMonthYear);
    const totals = calcularTotaisFinanceiros({
      salario: (resSal.data as any)?.amount || 0,
      extra: (resExtra.data || []).reduce((s, e) => s + Number(e.amount), 0),
      contas: resolved,
      dividas: (resDebts.data || []).map(d => ({ parcelaMensal: d.parcela_mensal })),
      metas: resGoals.data || []
    });

    setFinanceData(totals);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !financeData) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    // Simulação de IA contextual
    setTimeout(() => {
      let response: Message;
      const userMsgLower = userMsg.toLowerCase();
      const amountMatch = userMsg.match(/R\$\s?(\d+([.,]\d+)?)|(\d+([.,]\d+)?)/);
      const purchaseAmount = amountMatch ? parseFloat(amountMatch[0].replace("R$", "").replace(",", ".")) : null;

      // 1. ANÁLISE DE COMPRA ("Posso comprar...?")
      if (userMsgLower.includes("posso comprar") && purchaseAmount) {
        const remaining = financeData.disponivel;
        const afterPurchase = remaining - purchaseAmount;
        const impactPercentage = (purchaseAmount / (remaining || 1)) * 100;

        let recommendation = "";
        if (afterPurchase >= 0) {
          const percentageRemaining = (afterPurchase / financeData.renda) * 100;
          if (percentageRemaining > 15) {
            recommendation = "A compra está dentro do seu orçamento de segurança. ✅";
            response = {
              role: "bot",
              content: `Sim! Você pode comprar.

📊 **Resumo da Análise:**
• **Compra:** ${formatCurrency(purchaseAmount)}
• **Impacto:** -${impactPercentage.toFixed(0)}% do seu dinheiro livre
• **Saldo após compra:** ${formatCurrency(afterPurchase)}
• **Recomendação:** ${recommendation}`,
              type: "success"
            };
          } else {
            recommendation = "Comprar agora reduzirá sua margem de segurança significativamente. Considere esperar o próximo mês. ⚠️";
            response = {
              role: "bot",
              content: `Pode comprar, mas com cautela.

📊 **Resumo da Análise:**
• **Compra:** ${formatCurrency(purchaseAmount)}
• **Impacto:** -${impactPercentage.toFixed(0)}% do seu dinheiro livre
• **Saldo após compra:** ${formatCurrency(afterPurchase)}
• **Recomendação:** ${recommendation}`,
              type: "warning"
            };
          }
        } else {
          recommendation = `Essa compra excede seu saldo livre. Economizar ${formatCurrency(purchaseAmount - remaining)} extras permitiria a compra sem dívidas. ❌`;
          response = {
            role: "bot",
            content: `Não recomendado no momento.

📊 **Resumo da Análise:**
• **Compra:** ${formatCurrency(purchaseAmount)}
• **Impacto:** -${impactPercentage.toFixed(0)}% (Excede o disponível)
• **Saldo restante:** ${formatCurrency(remaining)}
• **Recomendação:** ${recommendation}`,
            type: "error"
          };
        }
      }
      // 2. RESUMO FINANCEIRO ("Resumo", "Como estou?")
      else if (userMsgLower.includes("resumo") || userMsgLower.includes("status") || userMsgLower.includes("saude") || userMsgLower.includes("saúde")) {
        const usageRatio = (financeData.gastos + financeData.totalMetas) / financeData.renda;
        let healthMsg = usageRatio < 0.7 ? "sua saúde financeira está excelente! Você está gastando menos de 70% do que ganha." :
                       usageRatio < 0.9 ? "você está em uma zona de atenção. Seus custos fixos e metas consomem grande parte da sua renda." :
                       "você está em uma zona crítica. Quase toda sua renda está comprometida.";

        response = {
          role: "bot",
          content: `Vitor, ${healthMsg}

📈 **Seus Números:**
• **Renda Total:** ${formatCurrency(financeData.renda)}
• **Gastos (Contas/Dívidas):** ${formatCurrency(financeData.gastos)}
• **Economia para Metas:** ${formatCurrency(financeData.totalMetas)}
• **Dinheiro Livre hoje:** ${formatCurrency(financeData.disponivel)}`,
          type: usageRatio < 0.7 ? "success" : usageRatio < 0.9 ? "warning" : "error"
        };
      }
      // 3. DICAS ("Dicas", "Ajuda", "Como poupar")
      else if (userMsgLower.includes("dica") || userMsgLower.includes("ajuda") || userMsgLower.includes("poupar")) {
        response = {
          role: "bot",
          content: `Aqui estão algumas dicas baseadas no seu perfil:

1. 🎯 **Foque nas Metas**: Você reservou ${formatCurrency(financeData.totalMetas)} este mês. Tente não mexer nesse valor.
2. 💸 **Pequenos Gastos**: Seu dinheiro livre é de ${formatCurrency(financeData.disponivel)}. Tente dividir esse valor por 4 para saber quanto pode gastar por semana.
3. ⚠️ **Atenção**: Se surgir um imprevisto, veja qual conta ou meta pode ser adiada sem gerar juros altos.`,
          type: "neutral"
        };
      }
      // 4. PADRÃO
      else {
        response = {
          role: "bot",
          content: "Desculpe, não entendi bem. Você pode me perguntar se 'posso comprar algo', pedir um 'resumo' da sua conta ou 'dicas' para economizar!",
          type: "neutral"
        };
      }

      setMessages(prev => [...prev, response]);
      setLoading(false);
    }, 1000);
  };

  if (premiumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen flex flex-col bg-background max-w-lg mx-auto border-x border-border/50 shadow-2xl">
        <div className="p-6 border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center gap-4 sticky top-0 z-20">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl bg-card border border-border/50">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">Consultor IA</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center shadow-xl">
             <Lock className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Funcionalidade Premium</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O Consultor IA e a ferramenta "Posso comprar?" são exclusivos para membros **Cofrinho Pro Premium**.
            </p>
          </div>

          <Card className="p-6 bg-gradient-to-br from-primary/20 to-transparent border-primary/30 w-full">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold uppercase tracking-wider">Benefícios Pro</span>
            </div>
            <ul className="text-left space-y-3">
               <li className="flex items-center gap-2 text-xs font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Análise personalizada de compras
               </li>
               <li className="flex items-center gap-2 text-xs font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Consultoria financeira 24h por dia
               </li>
               <li className="flex items-center gap-2 text-xs font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Simulações ilimitadas de cenários
               </li>
            </ul>
          </Card>

          <Button
            className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
            onClick={() => navigate("/premium")}
          >
            Conhecer o Premium <Sparkles className="ml-2 w-4 h-4" />
          </Button>

          <Button variant="ghost" onClick={() => navigate(-1)}>
            Voltar para o Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-lg mx-auto border-x border-border/50 shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center gap-4 sticky top-0 z-20">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl bg-card border border-border/50">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Consultor IA</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Premium</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex w-full", m.role === "user" ? "justify-end" : "justify-start animate-slide-up")}>
            <div className={cn(
              "max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm",
              m.role === "user"
                ? "bg-primary text-white rounded-tr-none"
                : cn(
                    "bg-card border border-border/50 rounded-tl-none flex gap-3 items-start",
                    m.type === "success" && "border-emerald-500/30 bg-emerald-500/5",
                    m.type === "warning" && "border-amber-500/30 bg-amber-500/5",
                    m.type === "error" && "border-destructive/30 bg-destructive/5"
                  )
            )}>
              {m.role === "bot" && (
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  m.type === "success" ? "bg-emerald-500/20 text-emerald-500" :
                  m.type === "warning" ? "bg-amber-500/20 text-amber-500" :
                  m.type === "error" ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary"
                )}>
                  {m.type === "success" ? <ShieldCheck className="w-4 h-4" /> :
                   m.type === "warning" ? <AlertCircle className="w-4 h-4" /> :
                   m.type === "error" ? <XCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
              )}
              <p className={m.role === "bot" ? "text-foreground font-medium" : "font-medium"}>{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border/50 p-4 rounded-3xl rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-card/80 backdrop-blur-xl border-t border-border/50 sticky bottom-0 z-30 pb-10">
        <div className="relative flex items-center gap-2 bg-muted p-2 rounded-2xl border border-border/50 focus-within:border-primary/50 transition-all shadow-inner">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Pergunte qualquer coisa..."
            className="border-none bg-transparent focus-visible:ring-0 h-10 text-sm"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="rounded-xl shrink-0 h-10 w-10 shadow-lg shadow-primary/20"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground text-center mt-3 uppercase tracking-tighter font-bold opacity-60">
          Dica: pergunte "Posso comprar um [item] de R$ [valor]?"
        </p>
      </div>
    </div>
  );
};

export default AIConsultant;
