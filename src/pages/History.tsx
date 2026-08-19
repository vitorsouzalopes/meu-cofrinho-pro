import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar, Receipt, ShoppingBag, Eye, Search, ArrowLeft, Upload, X, Check
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface HistoryItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  type: "expense" | "bill";
  category?: string;
  receipt_url?: string;
  month_year: string;
  account_id?: string;
  paid_id?: string; // id na tabela accounts (para atualizar receipt_url)
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatMonthYear = (monthYear: string) => {
  const [year, month] = monthYear.split("-").map(Number);
  const label = new Date(year, month - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const History = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Receipt modal
  const [receiptItem, setReceiptItem] = useState<HistoryItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchAllHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expensesRes, accountsRes] = await Promise.allSettled([
        supabase.from("expenses").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_template", false).eq("paid", true),
      ]);

      const expenses = expensesRes.status === "fulfilled" && !expensesRes.value.error
        ? (expensesRes.value.data || []) : [];
      const accounts = accountsRes.status === "fulfilled" && !accountsRes.value.error
        ? (accountsRes.value.data || []) : [];

      const merged: HistoryItem[] = [];

      expenses.forEach((e) => {
        const date = new Date(e.date + "T00:00:00");
        merged.push({
          id: `exp-${e.id}`,
          paid_id: e.id,
          name: e.description,
          amount: Number(e.amount),
          date: e.date,
          type: "expense",
          category: e.category,
          receipt_url: undefined,
          month_year: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        });
      });

      accounts.forEach((a) => {
        const my = a.month_year || "";
        const day = a.due_day ? String(a.due_day).padStart(2, "0") : "01";
        const dateStr = my ? `${my}-${day}` : new Date().toISOString().split("T")[0];
        merged.push({
          id: `acc-${a.id}`,
          paid_id: a.id,
          account_id: a.id,
          name: a.name,
          amount: Number(a.amount),
          date: dateStr,
          type: "bill",
          receipt_url: undefined,
          month_year: my,
        });
      });

      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistoryItems(merged);
    } catch {
      toast({ title: "Erro ao carregar histórico", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllHistory();
  }, [fetchAllHistory]);

  // ── Upload de comprovante ────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadReceipt = async () => {
    if (!receiptItem || !fileRef.current?.files?.[0] || !user) return;
    const file = fileRef.current.files[0];
    const ext = file.name.split(".").pop();
    const path = `receipts/${user.id}/${receiptItem.paid_id}-${Date.now()}.${ext}`;

    setUploading(true);
    const { error: upErr } = await supabase.storage.from("receipts").upload(path, file, { upsert: true });
    if (upErr) {
      toast({ title: "Erro no upload", description: upErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // Atualiza na tabela certa
    const table = receiptItem.type === "bill" ? "accounts" : "expenses";
    await supabase.from(table as any).update({ receipt_url: publicUrl }).eq("id", receiptItem.paid_id!);

    toast({ title: "Comprovante salvo!" });
    setUploading(false);
    setReceiptItem(null);
    setPreviewUrl(null);
    fetchAllHistory();
  };

  // ── Agrupamento ─────────────────────────────────────────────────────────────
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {};
    const filtered = historyItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    filtered.forEach((item) => {
      if (!groups[item.month_year]) groups[item.month_year] = [];
      groups[item.month_year].push(item);
    });
    return groups;
  }, [historyItems, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-10 max-w-lg mx-auto bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl bg-card border border-border/50">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Histórico Financeiro</h1>
      </div>

      {/* Search */}
      <div className="relative mb-8 animate-slide-up">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome ou categoria..."
          className="pl-11 h-12 bg-card border-border/50 rounded-2xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista */}
      <div className="space-y-10">
        {Object.keys(groupedByMonth).length === 0 ? (
          <div className="text-center py-20 bg-card/30 rounded-3xl border border-dashed border-border p-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhuma transação encontrada.</p>
          </div>
        ) : (
          Object.keys(groupedByMonth).sort().reverse().map((monthYear, monthIdx) => {
            const items = groupedByMonth[monthYear];
            const total = items.reduce((s, i) => s + i.amount, 0);

            return (
              <div key={monthYear} className="animate-slide-up" style={{ animationDelay: `${monthIdx * 0.1}s` }}>
                {/* Cabeçalho do mês */}
                <div className="flex justify-between items-end mb-4 px-1">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Mês de Referência</p>
                    <h2 className="text-lg font-bold text-foreground">{formatMonthYear(monthYear)}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Gastos</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(total)}</p>
                  </div>
                </div>

                <div className="space-y-3 relative">
                  <div className="absolute left-[23px] top-0 bottom-0 w-px bg-border/40 z-0" />
                  {items.map((item) => (
                    <Card key={item.id} className="p-4 bg-card border-border/40 shadow-sm relative z-10 hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                          item.type === "bill" ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"
                        }`}>
                          {item.type === "bill" ? <Receipt className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-[13px] font-bold text-foreground truncate">{item.name}</h3>
                            <p className="text-[13px] font-bold text-foreground whitespace-nowrap">{formatCurrency(item.amount)}</p>
                          </div>

                          <div className="flex justify-between items-center mt-2 gap-2 flex-wrap">
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.date + "T12:00:00").toLocaleDateString("pt-BR")}
                            </p>

                            <div className="flex items-center gap-1.5">
                              {item.receipt_url && (
                                <button
                                  onClick={() => window.open(item.receipt_url, "_blank")}
                                  className="flex items-center gap-1 text-[9px] bg-primary/10 text-primary px-2 py-1 rounded-lg font-bold hover:bg-primary/20 transition-colors"
                                >
                                  <Eye className="w-3 h-3" /> Ver
                                </button>
                              )}
                              <button
                                onClick={() => { setReceiptItem(item); setPreviewUrl(item.receipt_url || null); }}
                                className="flex items-center gap-1 text-[9px] bg-muted text-muted-foreground px-2 py-1 rounded-lg font-bold hover:text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Upload className="w-3 h-3" />
                                {item.receipt_url ? "Trocar" : "Comprovante"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      {!searchTerm && historyItems.length > 0 && (
        <Card className="mt-12 p-6 bg-gradient-to-br from-primary to-primary/80 border-none shadow-xl shadow-primary/20">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/70 text-[10px] uppercase font-bold mb-1 tracking-widest">Resumo Geral</p>
              <h3 className="text-white text-xl font-bold">Consolidado</h3>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-[10px] uppercase font-bold mb-1 tracking-widest">Total Acumulado</p>
              <p className="text-2xl font-bold text-white leading-none">
                {formatCurrency(historyItems.reduce((s, i) => s + i.amount, 0))}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Modal de Comprovante ────────────────────────────────────────────── */}
      <Dialog open={!!receiptItem} onOpenChange={(open) => { if (!open) { setReceiptItem(null); setPreviewUrl(null); } }}>
        <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Comprovante — {receiptItem?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Preview */}
            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-border/50">
                <img src={previewUrl} alt="Comprovante" className="w-full object-contain max-h-64" />
                <button
                  onClick={() => { setPreviewUrl(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 right-2 bg-card/80 backdrop-blur rounded-full p-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center hover:border-primary/40 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Clique para selecionar imagem</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">JPG, PNG ou PDF • Max 5MB</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12 rounded-xl" onClick={() => { setReceiptItem(null); setPreviewUrl(null); }}>
                Cancelar
              </Button>
              <Button
                className="h-12 rounded-xl font-bold"
                onClick={uploadReceipt}
                disabled={uploading || !previewUrl || previewUrl === receiptItem?.receipt_url}
              >
                {uploading ? "Enviando..." : (
                  <><Check className="w-4 h-4 mr-2" /> Salvar</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;
