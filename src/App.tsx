import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useGestureBack } from "@/hooks/use-gesture-back";
import Today from "./pages/Today.tsx";
import Accounts from "./pages/Accounts.tsx";
import Investments from "./pages/Investments.tsx";
import InvestmentSuggestions from "./pages/InvestmentSuggestions.tsx";
import Allocation from "./pages/Allocation.tsx";
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
    <Route path="/investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
    <Route path="/suggestions" element={<ProtectedRoute><InvestmentSuggestions /></ProtectedRoute>} />
    <Route path="/allocation" element={<ProtectedRoute><Allocation /></ProtectedRoute>} />
    <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
    <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
    <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
    <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
    <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
    <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
    <Route path="/telegram" element={<ProtectedRoute><TelegramSettings /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/download" element={<Download />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const AppContent = () => {
  const { session } = useAuth();
  const [updateConfig, setUpdateConfig] = useState<{ min_version: string; download_url: string; message: string } | null>(null);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useScrollRestoration();
  useGestureBack();

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
