import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type Row = { id: string; email: string | null; display_name: string | null; created_at: string; is_premium: boolean };

export default function AdminPremium() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [onlyPremium, setOnlyPremium] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) { setIsAdmin(false); return; }
      setIsAdmin(true);
      const { data } = await supabase.from("profiles").select("id,email,display_name,created_at,is_premium").order("created_at", { ascending: false });
      setRows((data as Row[]) || []);
    })();
  }, [user]);

  const filtered = useMemo(() => rows.filter(r =>
    (!onlyPremium || r.is_premium) &&
    `${r.email ?? ""} ${r.display_name ?? ""}`.toLowerCase().includes(q.toLowerCase())
  ), [rows, q, onlyPremium]);

  const toggle = async (r: Row, value: boolean) => {
    setRows(prev => prev.map(x => x.id === r.id ? { ...x, is_premium: value } : x));
    const { error } = await supabase.rpc("admin_set_premium", { _user_id: r.id, _value: value });
    if (error) {
      setRows(prev => prev.map(x => x.id === r.id ? { ...x, is_premium: !value } : x));
      toast({ title: "Erro ao alterar", description: error.message, variant: "destructive" });
    } else toast({ title: value ? "Premium ativado" : "Premium removido", description: r.email ?? "" });
  };

  if (isAdmin === false) return <div className="p-6 text-center text-muted-foreground">Acesso restrito a administradores.</div>;

  return (
    <div className="min-h-screen p-4 pb-24 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4"><ArrowLeft className="w-4 h-4" /> Voltar</button>
      <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2 mb-1"><Crown className="w-5 h-5 text-gold" /> Gerenciar Premium</h1>
      <p className="text-xs text-muted-foreground mb-4">{rows.filter(r => r.is_premium).length} Premium de {rows.length} usuários</p>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar nome ou e-mail" className="pl-9" />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={onlyPremium} onCheckedChange={setOnlyPremium} /> Só Premium</label>
      </div>
      <div className="space-y-2">
        {filtered.map(r => (
          <div key={r.id} className="glass-card p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{r.display_name || "Sem nome"}</p>
              <p className="text-xs text-muted-foreground truncate">{r.email}</p>
              <p className="text-[10px] text-muted-foreground">Desde {new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
            <Switch checked={r.is_premium} onCheckedChange={v => toggle(r, v)} />
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nenhum usuário encontrado.</p>}
      </div>
    </div>
  );
}
