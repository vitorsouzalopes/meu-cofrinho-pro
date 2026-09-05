import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Mail, Lock, User, ArrowRight, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hapticImpact, hapticNotification } from "@/lib/native-ui";
import { NotificationType } from "@capacitor/haptics";
import { checkBiometric, authenticateBiometric, getBiometricCredentials, setBiometricCredentials } from "@/lib/biometric";
import { Capacitor } from "@capacitor/core";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkBio = async () => {
      const bio = await checkBiometric();
      if (bio.available) {
        const creds = await getBiometricCredentials();
        if (creds) {
          setHasBiometric(true);
        }
      }
    };
    checkBio();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Email enviado", description: "Verifique sua caixa de entrada para redefinir sua senha." });
      setIsResetPassword(false);
      setIsLogin(true);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    const success = await authenticateBiometric();
    if (success) {
      const creds = await getBiometricCredentials();
      if (creds) {
        setLoading(true);
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: creds.username,
            password: creds.password
          });
          if (error) throw error;
          hapticNotification(NotificationType.Success);
          navigate("/");
        } catch (error: any) {
          hapticNotification(NotificationType.Error);
          toast({ title: "Erro na biometria", description: error.message, variant: "destructive" });
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (Capacitor.isNativePlatform()) {
          const bio = await checkBiometric();
          if (bio.available) {
            await setBiometricCredentials(email, password);
          }
        }

        hapticNotification(NotificationType.Success);
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        hapticNotification(NotificationType.Success);
        toast({
          title: "Conta criada! 🎉",
          description: "Você já está logado. Bom desafio!",
        });
        navigate("/");
      }
    } catch (error) {
      hapticNotification(NotificationType.Error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-3">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto shadow-xl">
                <Mail className="w-8 h-8 text-primary" />
             </div>
             <h1 className="text-2xl font-bold text-foreground">Recuperar Senha</h1>
             <p className="text-sm text-muted-foreground">Enviaremos um link de acesso para o seu email.</p>
          </div>

          <form onSubmit={handleResetPassword} className="glass-card p-6 space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Seu email cadastrado"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <Button variant="gold" className="w-full h-12 font-bold" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Link de Recuperação"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setIsResetPassword(false)}>
              Voltar para Login
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="w-32 h-32 mx-auto animate-float">
            <img
              src="/logo.png"
              alt="Cofrinho PRO"
              className="w-full h-full object-contain drop-shadow-2xl"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              onError={(e) => {
                // Fallback if image not found
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = "w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto glow-gold";
                  fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-foreground"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold text-foreground">Cofrinho <span className="text-gold">PRO</span></h1>
            <p className="text-xs text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
              Seu planejamento financeiro inteligente começa aqui.
            </p>
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            {isLogin ? "Entre na sua conta" : "Crie sua conta gratuita"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="displayName"
                placeholder="Seu nome"
                aria-label="Seu nome completo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-10 bg-muted/50 border-border/50"
                required={!isLogin}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              placeholder="Email"
              aria-label="Endereço de email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-muted/50 border-border/50"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              placeholder="Senha"
              aria-label="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 bg-muted/50 border-border/50"
              required
              minLength={6}
            />
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsResetPassword(true)}
                className="text-xs text-muted-foreground hover:text-primary font-medium"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <Button variant="gold" className="w-full h-12 font-bold" type="submit" disabled={loading}>
            {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
            <ArrowRight className="w-4 h-4" />
          </Button>

          {isLogin && hasBiometric && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gold/30 text-gold"
              onClick={handleBiometricLogin}
              disabled={loading}
            >
              Entrar com Biometria
              <Fingerprint className="w-4 h-4 ml-2" />
            </Button>
          )}

          <div className="pt-4 border-t border-border/30">
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full text-[10px] text-muted-foreground hover:text-destructive transition-colors uppercase tracking-widest font-bold"
            >
              ⚠️ Limpar dados temporários (Dev Mode)
            </button>
          </div>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-gold font-semibold hover:underline"
          >
            {isLogin ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
