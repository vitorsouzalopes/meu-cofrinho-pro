import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import NotificationWall from "@/components/NotificationWall";
import { Capacitor } from "@capacitor/core";

/**
 * Protetor de Rota como Layout (Envelope)
 * Bloqueia o acesso se não estiver logado ou se as notificações (obrigatórias) estiverem desativadas.
 */
export const ProtectedLayout = () => {
  const { session, loading, pushStatus, pushChecked, checkPushPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0E1A] text-white p-8">
        <div className="w-12 h-12 border-4 border-[#D4A017] border-t-transparent rounded-full animate-spin mb-6" />
        <div className="space-y-4 text-center">
          <h2 className="text-lg font-bold tracking-widest uppercase">Cofrinho PRO</h2>
          <p className="text-[10px] text-muted-foreground animate-pulse tracking-widest uppercase">Validando credenciais...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;

  // BLOQUEIO OBRIGATÓRIO DE NOTIFICAÇÕES (Modo Nativo)
  const isBypass = ['granted', 'web', 'timeout', 'error'].includes(pushStatus || '');
  if (Capacitor.isNativePlatform() && pushChecked && !isBypass) {
    return <NotificationWall onRetry={() => checkPushPermission(true)} />;
  }

  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
};

export const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
};
