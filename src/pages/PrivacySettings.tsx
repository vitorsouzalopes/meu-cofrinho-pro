import { useState } from "react";
import { ArrowLeft, Shield, FileText, Lock, UserCheck, Trash2, Mail, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const PrivacySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const privacyEmail = "vitorsouzalopes@souunisuam.com.br";

  const handleDataRequest = (type: string) => {
    const subject = encodeURIComponent(`Solicitação LGPD: ${type} - Cofrinho Pro`);
    const body = encodeURIComponent(
      `Olá,\n\nGostaria de solicitar o exercício do seguinte direito LGPD: ${type}.\n\nIdentificação do usuário (E-mail): ${user?.email || "Não autenticado"}\nUser ID: ${user?.id || "N/A"}\n\nAguardom retorno conforme a legislação aplicável.\n\nAtenciosamente,`
    );
    window.location.href = `mailto:${privacyEmail}?subject=${subject}&body=${body}`;
  };

  const legalDocs = [
    {
      title: "Política de Privacidade",
      description: "Como tratamos seus dados pessoais e garantimos sua segurança.",
      file: "PRIVACY_POLICY.md",
      content: `O Cofrinho Pro é um aplicativo de organização financeira pessoal, sob responsabilidade de Vitor de Souza Corrêa Lopes (vitorsouzalopes@souunisuam.com.br).\n\nTratamos dados de cadastro, registros financeiros, preferências e tokens de notificação com base na LGPD (Lei nº 13.709/2018). Você pode solicitar acesso, correção ou exclusão a qualquer momento.`
    },
    {
      title: "Termos de Serviço",
      description: "Condições de uso, responsabilidades e regras do aplicativo.",
      file: "TERMS_OF_SERVICE.md",
      content: `O Cofrinho Pro disponibiliza ferramentas de organização financeira pessoal. Os cálculos e projeções possuem finalidade informativa. O usuário é responsável por suas credenciais e uso lícito.`
    },
    {
      title: "Aviso de Cookies e Tecnologias",
      description: "Uso de armazenamento local, cookies e identificadores técnicos.",
      file: "COOKIE_NOTICE.md",
      content: `Utilizamos tecnologias necessárias para autenticação e segurança. Tecnologias opcionais de análise e publicidade respeitarão seu consentimento prévio.`
    },
    {
      title: "Política de Cancelamento e Reembolso",
      description: "Diretrizes sobre assinaturas, cancelamento e direito de arrependimento.",
      file: "REFUND_POLICY.md",
      content: `Respeitamos o direito de arrependimento de 7 dias previsto no Código de Defesa do Consumidor. Planos Premium e condições de reembolso estarão ativos na comercialização oficial.`
    },
    {
      title: "Exercício de Direitos (LGPD)",
      description: "Seus direitos como titular de dados e como exercê-los.",
      file: "DATA_RIGHTS.md",
      content: `Você tem direito a confirmação de tratamento, acesso, correção, portabilidade, anonimização e exclusão. Contato direto: vitorsouzalopes@souunisuam.com.br.`
    }
  ];

  return (
    <div className="min-h-screen pb-24 px-6 pt-10 max-w-lg mx-auto bg-background animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl bg-card border border-border/50" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Privacidade e Meus Dados</h1>
      </div>

      <div className="space-y-6">
        {/* Intro */}
        <div className="p-5 rounded-3xl bg-primary/5 border border-primary/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Sua privacidade em primeiro lugar</h2>
              <p className="text-xs text-muted-foreground">Em conformidade com a LGPD (Lei 13.709/2018)</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Aqui você pode consultar todas as políticas legais do Cofrinho Pro e exercer seus direitos de titular de dados de forma simples e transparente.
          </p>
        </div>

        {/* Legal Documents Section */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Documentos Legais</p>
          <div className="space-y-2">
            {legalDocs.map((doc, idx) => (
              <Card
                key={idx}
                onClick={() => setActiveModal(doc.title)}
                className="p-4 bg-card border-border/50 hover:border-primary/40 transition-all cursor-pointer flex items-center justify-between group rounded-2xl"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors text-muted-foreground">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{doc.title}</h3>
                    <p className="text-[11px] text-muted-foreground">{doc.description}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </Card>
            ))}
          </div>
        </div>

        {/* LGPD Rights Request Section */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Seus Direitos (LGPD)</p>

          <Card className="p-5 bg-card border-border/50 space-y-4 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Solicitações ao Controlador</h3>
                <p className="text-[11px] text-muted-foreground">Controlador: Vitor de Souza Corrêa Lopes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => handleDataRequest("Acesso aos Dados Pessoais")}
                className="justify-start h-12 rounded-xl text-xs font-medium border-border/50 hover:bg-primary/5 hover:text-primary"
              >
                <Lock className="w-4 h-4 mr-3 text-muted-foreground" />
                Solicitar Acesso aos Dados
              </Button>

              <Button
                variant="outline"
                onClick={() => handleDataRequest("Correção de Dados Incorretos")}
                className="justify-start h-12 rounded-xl text-xs font-medium border-border/50 hover:bg-primary/5 hover:text-primary"
              >
                <Shield className="w-4 h-4 mr-3 text-muted-foreground" />
                Solicitar Correção de Informações
              </Button>

              <Button
                variant="outline"
                onClick={() => handleDataRequest("Portabilidade de Dados")}
                className="justify-start h-12 rounded-xl text-xs font-medium border-border/50 hover:bg-primary/5 hover:text-primary"
              >
                <FileText className="w-4 h-4 mr-3 text-muted-foreground" />
                Solicitar Portabilidade
              </Button>

              <Button
                variant="outline"
                onClick={() => handleDataRequest("Exclusão de Conta e Dados Pessoais")}
                className="justify-start h-12 rounded-xl text-xs font-medium border-destructive/30 hover:bg-destructive/10 text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-3 text-destructive" />
                Solicitar Exclusão de Conta e Dados
              </Button>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                As solicitações são processadas diretamente via e-mail seguro (<span className="text-foreground font-medium">{privacyEmail}</span>) em conformidade com os prazos legais da LGPD.
              </p>
            </div>
          </Card>
        </div>

        {/* Privacy Contact Card */}
        <Card className="p-5 bg-card border-border/50 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Canal de Privacidade</p>
              <p className="text-xs font-medium text-foreground">{privacyEmail}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              window.location.href = `mailto:${privacyEmail}?subject=Dúvida Privacidade - Cofrinho Pro`;
            }}
            className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-600/90 text-white text-xs"
          >
            Contatar
          </Button>
        </Card>
      </div>

      {/* Document Viewer Dialog */}
      <Dialog open={!!activeModal} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{activeModal}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Documento oficial de conformidade do Cofrinho Pro.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {legalDocs.find(d => d.title === activeModal) && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-3">
                <p className="text-xs font-semibold text-foreground">Resumo Oficial:</p>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {legalDocs.find(d => d.title === activeModal)?.content}
                </p>
              </div>
            )}
            <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Dúvidas sobre este termo?</span>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 rounded-xl"
                onClick={() => {
                  setActiveModal(null);
                  window.location.href = `mailto:${privacyEmail}?subject=Dúvida sobre ${activeModal}`;
                }}
              >
                Enviar E-mail
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrivacySettings;
