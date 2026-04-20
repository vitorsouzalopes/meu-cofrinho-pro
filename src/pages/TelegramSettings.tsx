import { useState, useEffect } from "react";
import { Settings, Send, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type TelegramConfig = Tables<"telegram_config">;

const TelegramSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<TelegramConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState("");
  const [userId, setUserId] = useState("");
  const [reminderDays, setReminderDays] = useState(2);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch existing config
  useEffect(() => {
    if (!user) return;
    const fetchConfig = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("telegram_config")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setConfig(data);
        setReminderDays(data.reminder_days_before);
      }
      setLoading(false);
    };
    fetchConfig();
  }, [user]);

  const handleSave = async () => {
    if (!user || !chatId.trim() || !userId.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    
    if (config) {
      const { error } = await supabase
        .from("telegram_config")
        .update({
          telegram_chat_id: parseInt(chatId),
          telegram_user_id: parseInt(userId),
          reminder_days_before: reminderDays,
          updated_at: new Date().toISOString(),
        })
        .eq("id", config.id);

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Configuração atualizada com sucesso!" });
      }
    } else {
      const { error } = await supabase
        .from("telegram_config")
        .insert({
          user_id: user.id,
          telegram_chat_id: parseInt(chatId),
          telegram_user_id: parseInt(userId),
          reminder_days_before: reminderDays,
        });

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Configuração salva com sucesso!" });
        setChatId("");
        setUserId("");
      }
    }
    setSaving(false);
  };

  const handleCopyBotCommand = () => {
    const botToken = "SEU_TOKEN_BOT_AQUI"; // Será gerado pelo bot
    navigator.clipboard.writeText(`/connect ${botToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6 animate-slide-up">
        <Settings className="w-6 h-6 text-gold" />
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Integração Telegram</h1>
          <p className="text-xs text-muted-foreground">Conecte seu bot para receber lembretes</p>
        </div>
      </div>

      {/* Info */}
      <div className="glass-card p-4 mb-4 bg-blue-500/10 border border-blue-500/20 animate-slide-up">
        <p className="text-sm text-foreground mb-2">Como funciona:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Crie um bot no Telegram via @BotFather</li>
          <li>• Copie o token do bot</li>
          <li>• Encontre seu Chat ID iniciando uma conversa com seu bot</li>
          <li>• Preencha os dados abaixo</li>
          <li>• Receberá lembretes 2-3 dias antes do vencimento</li>
        </ul>
      </div>

      {/* Configuration Form */}
      <div className="glass-card p-5 space-y-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Seu Chat ID do Telegram</label>
          <Input
            type="number"
            placeholder="Ex: 123456789"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            className="bg-muted border-border"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Encontre iniciando uma conversa com seu bot
          </p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Seu User ID do Telegram</label>
          <Input
            type="number"
            placeholder="Ex: 987654321"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="bg-muted border-border"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Peça ao bot com /myid
          </p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Dias de antecedência para lembrete</label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              max="7"
              value={reminderDays}
              onChange={(e) => setReminderDays(parseInt(e.target.value) || 2)}
              className="bg-muted border-border flex-1"
            />
            <span className="text-xs text-muted-foreground flex items-center">dias</span>
          </div>
        </div>

        <Button
          variant="gold"
          className="w-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Salvando..." : (config ? "Atualizar Configuração" : "Salvar Configuração")}
          <Send className="w-4 h-4 ml-2" />
        </Button>

        {config && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" />
              Conectado ao Telegram
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="glass-card p-4 mt-4 space-y-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <h3 className="font-heading font-semibold text-foreground text-sm">Passos rápidos:</h3>
        <div className="space-y-2 text-xs">
          <div>
            <p className="text-muted-foreground font-medium">1. Crie o bot no Telegram</p>
            <p className="text-muted-foreground">Procure @BotFather → /newbot</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">2. Envie /myid para seu bot</p>
            <p className="text-muted-foreground">Copie o Chat ID que receber</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">3. Preencha os dados</p>
            <p className="text-muted-foreground">Cole os valores nos campos acima</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">4. Pronto!</p>
            <p className="text-muted-foreground">Receberá lembretes automáticos antes do vencimento</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramSettings;
