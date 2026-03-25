import { useState } from "react";
import { Plus, Trash2, Home, User, ShoppingCart, Zap, Car, Heart, UtensilsCrossed, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

const categories = [
  { id: "casa", label: "Casa", icon: Home, color: "text-gold" },
  { id: "pessoal", label: "Pessoal", icon: User, color: "text-primary" },
  { id: "mercado", label: "Mercado", icon: ShoppingCart, color: "text-emerald-accent" },
  { id: "contas", label: "Contas", icon: Zap, color: "text-streak" },
  { id: "transporte", label: "Transporte", icon: Car, color: "text-muted-foreground" },
  { id: "saude", label: "Saúde", icon: Heart, color: "text-destructive" },
  { id: "alimentacao", label: "Alimentação", icon: UtensilsCrossed, color: "text-accent" },
  { id: "outros", label: "Outros", icon: MoreHorizontal, color: "text-muted-foreground" },
];

const getCategoryInfo = (id: string) => categories.find((c) => c.id === id) || categories[categories.length - 1];

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const Expenses = () => {
  const now = new Date();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("casa");
  const [date, setDate] = useState(now.toISOString().split("T")[0]);

  const addExpense = () => {
    if (!desc.trim() || !amount) return;
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description: desc.trim(),
      amount: parseFloat(amount),
      category,
      date,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    setDesc("");
    setAmount("");
    setCategory("casa");
    setDate(now.toISOString().split("T")[0]);
    setDialogOpen(false);
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const todayStr = now.toISOString().split("T")[0];
  const todayExpenses = expenses.filter((e) => e.date === todayStr);
  const totalToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category for summary
  const categoryTotals = monthExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Minhas Contas</h1>
          <p className="text-xs text-muted-foreground">Controle seus gastos diários</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" size="sm" className="rounded-full w-10 h-10 p-0">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
            <DialogHeader>
              <DialogTitle className="font-heading text-foreground">Novo Gasto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
                <Input
                  placeholder="Ex: Conta de luz"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor (R$)</label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-muted border-border"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-xs ${
                          isSelected
                            ? "bg-primary/20 border border-primary/50"
                            : "bg-muted border border-transparent hover:border-border"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${cat.color}`} />
                        <span className="text-[10px] text-muted-foreground">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button variant="gold" className="w-full" onClick={addExpense} disabled={!desc.trim() || !amount}>
                Adicionar Gasto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today summary */}
      <div className="glass-card p-5 mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gastos de Hoje</p>
        <p className="font-heading text-2xl font-bold text-streak">
          R$ {totalToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{todayExpenses.length} lançamento(s)</p>
      </div>

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide animate-slide-up" style={{ animationDelay: "0.15s" }}>
        {months.map((m, i) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedMonth === i
                ? "bg-primary/20 text-gold border border-primary/50"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Month total */}
      <div className="glass-card p-5 mb-4 glow-gold animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Total de {months[selectedMonth]}
        </p>
        <p className="font-heading text-3xl font-bold text-gold">
          R$ {totalMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Category breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="glass-card p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <h3 className="font-heading font-semibold text-foreground text-sm mb-3">Por Categoria</h3>
          <div className="space-y-2">
            {Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([catId, total]) => {
                const cat = getCategoryInfo(catId);
                const Icon = cat.icon;
                const pct = totalMonth > 0 ? (total / totalMonth) * 100 : 0;
                return (
                  <div key={catId} className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${cat.color} shrink-0`} />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground font-medium">{cat.label}</span>
                        <span className="text-muted-foreground">
                          R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Expenses list */}
      <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h3 className="font-heading font-semibold text-foreground text-sm">
          Lançamentos — {months[selectedMonth]}
        </h3>
        {monthExpenses.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground text-sm">Nenhum gasto registrado neste mês.</p>
            <p className="text-xs text-muted-foreground mt-1">Toque no + para adicionar.</p>
          </div>
        ) : (
          monthExpenses
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((exp) => {
              const cat = getCategoryInfo(exp.category);
              const Icon = cat.icon;
              return (
                <div key={exp.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${cat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{exp.description}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(exp.date).toLocaleDateString("pt-BR")} · {cat.label}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-streak whitespace-nowrap">
                    -R$ {exp.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => removeExpense(exp.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default Expenses;
