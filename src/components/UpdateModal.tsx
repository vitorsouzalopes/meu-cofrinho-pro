import { Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UpdateModalProps {
  downloadUrl: string;
  message?: string;
}

const UpdateModal = ({ downloadUrl, message }: UpdateModalProps) => {
  const handleUpdate = () => {
    window.open(downloadUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <Card className="max-w-sm w-full p-8 border-gold/40 bg-gold/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Download className="w-24 h-24 text-gold rotate-12" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-gold" />
          </div>
          
          <h1 className="font-heading text-2xl font-bold text-foreground mb-3">
            Atualização Obrigatória
          </h1>
          
          <p className="text-sm text-muted-foreground mb-8 line-height-relaxed">
            {message || "Uma nova versão do aplicativo está disponível com melhorias importantes. Por favor, atualize para continuar."}
          </p>
          
          <Button 
            variant="gold" 
            className="w-full h-12 text-lg font-bold shadow-lg shadow-gold/20 hover:scale-[1.02] transition-transform active:scale-[0.98]"
            onClick={handleUpdate}
          >
            <Download className="w-5 h-5 mr-2" />
            Atualizar Agora
          </Button>
          
          <p className="text-[10px] text-muted-foreground mt-6 uppercase tracking-widest">
            Meu Cofrinho Pro
          </p>
        </div>
      </Card>
    </div>
  );
};

export default UpdateModal;
