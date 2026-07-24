import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useGestureBack } from "@/hooks/use-gesture-back";
import { checkForUpdates } from "@/lib/version";
import { registerNativePush } from "@/lib/native-push";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import Today from "./pages/Today.tsx";
import Accounts from "./pages/Accounts.tsx";
import History from "./pages/History.tsx";
import Challenges from "./pages/Challenges.tsx";
import Progress from "./pages/Progress.tsx";
import Ranking from "./pages/Ranking.tsx";
import Premium from "./pages/Premium.tsx";
import Expenses from "./pages/Expenses.tsx";
import TelegramSettings from "./pages/TelegramSettings.tsx";
import Download from "./pages/Download.tsx";
import Auth from "./pages/Auth.tsx";
import Profile from "./pages/Profile.tsx";
import NotFound from "./pages/NotFound.tsx";
import MonthlyAccounts from "./pages/MonthlyAccounts.tsx";
import Goals from "./pages/Goals.tsx";
import Planner from "./pages/Planner.tsx";
import VidaFit from "./pages/VidaFit.tsx";
import AIConsultant from "./pages/AIConsultant.tsx";
import UpdateModal from "./components/UpdateModal";
import { CURRENT_VERSION } from "./constants/version";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/" element={<ProtectedRoute><Today /></ProtectedRoute>} />
    <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
    <Route path="/monthly-accounts" element={<ProtectedRoute><MonthlyAccounts /></ProtectedRoute>} />
    <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
    <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />

    <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
    <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
    <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
    <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
    <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
    <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
    <Route path="/telegram" element={<ProtectedRoute><TelegramSettings /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/vidafit" element={<ProtectedRoute><VidaFit /></ProtectedRoute>} />
    <Route path="/ai-consultant" element={<ProtectedRoute><AIConsultant /></ProtectedRoute>} />
    <Route path="/download" element={<Download />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const AppContent = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [updateConfig, setUpdateConfig] = useState<{ min_version: string; download_url: string; message: string } | null>(null);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useScrollRestoration();
  useGestureBack();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });
      return () => {
        backListener.then(l => l.remove());
      };
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      registerNativePush(session.user.id);
    }
  }, [session]);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const { data, error } = await supabase
          .from("app_config" as any)
          .select("*")
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error checking app version:", error);
          return;
        }

        if (data) {
          const config = data as any;
          const isOlder = (current: string, min: string) => {
            const c = current.split('.').map(Number);
            const m = min.split('.').map(Number);
            for (let i = 0; i < Math.max(c.length, m.length); i++) {
              const cv = c[i] || 0;
              const mv = m[i] || 0;
              if (cv < mv) return true;
              if (cv > mv) return false;
            }
            return false;
          };

          if (isOlder(CURRENT_VERSION, config.min_version)) {
            setUpdateConfig(config);
            setNeedsUpdate(true);
          }
        }
      } catch (e) {
        console.error("Failed to check version:", e);
      }
    };

    checkVersion();
  }, []);

  // Heartbeat: Check for frontend updates every 30 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await checkForUpdates();
      if (updated) {
        window.location.reload();
      }
    }, 1000 * 60 * 30);
    
    return () => clearInterval(interval);
  }, []);

  if (needsUpdate && updateConfig) {
    return <UpdateModal downloadUrl={updateConfig.download_url} message={updateConfig.message} />;
  }

  return (
    <>
      <AppRoutes />
      {session && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
