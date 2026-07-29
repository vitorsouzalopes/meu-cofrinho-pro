import { ArrowLeft, Mail, MessageCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Support = () => {
  const navigate = useNavigate();

  const handleEmailClick = () => {
    const email = "vitorsouzalopes@souunisuam.com.br";
    const subject = encodeURIComponent("Suporte - Cofrinho Pro");
    const body = encodeURIComponent("Olá!\n\nGostaria de relatar um problema/sugerir uma melhoria no Cofrinho Pro.\n\nDescrição:\n\n____________________________");
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleWhatsAppClick = () => {
    const phone = "5521979449600";
    const text = encodeURIComponent("Olá! Preciso de ajuda com o aplicativo Cofrinho Pro.");
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen pb-24 px-6 pt-10 max-w-lg mx-auto bg-background animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl bg-card border border-border/50">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Ajuda e Suporte</h1>
      </div>

      <div className="space-y-6">
        {/* Intro */}
        <div className="text-center space-y-3 py-4">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto shadow-xl">
            <HelpCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">❓ Precisa de ajuda?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nossa equipe está pronta para ajudar você.
            Caso tenha dúvidas, encontre algum problema no aplicativo ou queira enviar sugestões de melhorias, entre em contato por um dos canais abaixo.
          </p>
        </div>

        {/* Email Section */}
        <Card className="p-6 bg-card border-border/50 shadow-lg group hover:border-primary/30 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">E-mail</p>
              <p className="text-sm font-medium text-foreground">vitorsouzalopes@souunisuam.com.br</p>
            </div>
          </div>
          <Button
            onClick={handleEmailClick}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold"
          >
            <Mail className="w-4 h-4 mr-2" />
            Enviar E-mail
          </Button>
        </Card>

        {/* WhatsApp Section */}
        <Card className="p-6 bg-card border-border/50 shadow-lg group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">WhatsApp</p>
              <p className="text-sm font-medium text-foreground">(21) 97944-9600</p>
            </div>
          </div>
          <Button
            onClick={handleWhatsAppClick}
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-600/90 font-bold"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Conversar no WhatsApp
          </Button>
        </Card>

        {/* Additional Message */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed text-center italic">
            💬 Seu feedback é muito importante para continuarmos melhorando o Cofrinho Pro. Respondemos às solicitações o mais breve possível.
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="w-full h-12 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    </div>
  );
};

export default Support;
