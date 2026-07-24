import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Sparkles, Send, Bot, User, ShieldCheck, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calcularTotaisFinanceiros, resolverContasDoMes } from "@/lib/finance-utils";
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

    // Simulação de IA "Posso comprar?"
    setTimeout(() => {
      let response: Message;
      const amountMatch = userMsg.match(/R\$\s?(\d+([.,]\d+)?)|(\d+([.,]\d+)?)/);
      const purchaseAmount = amountMatch ? parseFloat(amountMatch[0].replace("R$", "").replace(",", ".")) : null;

      if (userMsg.toLowerCase().includes("posso comprar") && purchaseAmount) {
        const remaining = financeData.disponivel;
        const afterPurchase = remaining - purchaseAmount;

        if (afterPurchase >= 0) {
          const percentageRemaining = (afterPurchase / financeData.renda) * 100;
          if (percentageRemaining > 15) {
            response = {
              role: "bot",
              content: `Sim! Hoje você possui ${formatCurrency(remaining)} de Dinheiro Livre. Após essa compra de ${formatCurrency(purchaseAmount)}, ainda restarão ${formatCurrency(afterPurchase)}. Suas contas e metas continuarão protegidas. ✅`,
              type: "success"
            };
          } else {
            response = {
              role: "bot",
              content: `Pode comprar, mas atenção: isso reduzirá sua margem de segurança. Você ficaria com apenas ${formatCurrency(afterPurchase)} livres até o fim do mês. Suas metas podem ser afetadas. ⚠️`,
              type: "warning"
            };
          }
        } else {
          response = {
            role: "bot",
            content: `Não recomendado. Essa compra de ${formatCurrency(purchaseAmount)} excede seu Dinheiro Livre atual (${formatCurrency(remaining)}). Isso comprometeria o pagamento de suas contas ou suas metas de economia. ❌`,
            type: "error"
          };
        }
      } else {
        response = {
          role: "bot",
          content: `Entendi. Com base no seu planejamento, sua renda total é ${formatCurrency(financeData.renda)} e você tem ${formatCurrency(financeData.disponivel)} de Dinheiro Livre após reservar ${formatCurrency(financeData.gastos)} para contas/dívidas e ${formatCurrency(financeData.totalMetas)} para seus objetivos.`,
          type: "neutral"
        };
      }

      setMessages(prev => [...prev, response]);
      setLoading(false);
    }, 1000);
  };

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
      <div className="p-6 bg-card/80 backdrop-blur-xl border-t border-border/50 sticky bottom-0">
        <div className="relative flex items-center gap-2 bg-muted p-2 rounded-2xl border border-border/50 focus-within:border-primary/50 transition-all">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Pergunte qualquer coisa..."
            className="border-none bg-transparent focus-visible:ring-0 h-10"
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
        <p className="text-[9px] text-muted-foreground text-center mt-3 uppercase tracking-tighter font-bold">
          Dica: pergunte "Posso comprar um [item] de R$ [valor]?"
        </p>
      </div>
    </div>
  );
};

export default AIConsultant;
