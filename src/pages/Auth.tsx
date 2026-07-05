import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Mail, Lock, User, ArrowRight, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hapticImpact, hapticNotification } from "@/lib/native-ui";
import { NotificationType } from "@capacitor/haptics";
import { useEffect, useState } from "react";
import { checkBiometric, authenticateBiometric, getBiometricCredentials, setBiometricCredentials } from "@/lib/biometric";
import { Capacitor } from "@capacitor/core";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto glow-gold">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Cofrinho Pro</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Entre na sua conta" : "Crie sua conta gratuita"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Seu nome"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-10 bg-muted/50 border-border/50"
                required={!isLogin}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-muted/50 border-border/50"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 bg-muted/50 border-border/50"
              required
              minLength={6}
            />
          </div>
          <Button variant="gold" className="w-full" type="submit" disabled={loading}>
            {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
            <ArrowRight className="w-4 h-4" />
          </Button>

          {isLogin && hasBiometric && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-gold/30 text-gold"
              onClick={handleBiometricLogin}
              disabled={loading}
            >
              Entrar com Biometria
              <Fingerprint className="w-4 h-4 ml-2" />
            </Button>
          )}
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
