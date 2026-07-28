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
import { registerNativePush } from "@/lib/native-push";
import { App as CapacitorApp } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
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
import AIConsultant from "./pages/AIConsultant.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotificationWall from "./components/NotificationWall.tsx";
import UpdateModal from "./components/UpdateModal";
import { CURRENT_VERSION } from "./constants/version";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./components/ui/button";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0E1A] text-white p-8">
        <div className="w-12 h-12 border-4 border-[#D4A017] border-t-transparent rounded-full animate-spin mb-6" />
        <div className="space-y-4 text-center">
          <h2 className="text-lg font-bold tracking-widest uppercase">Cofrinho PRO</h2>
          <p className="text-[10px] text-muted-foreground animate-pulse tracking-widest uppercase">Acessando sistema...</p>
        </div>
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
    <Route path="/ai-consultant" element={<ProtectedRoute><AIConsultant /></ProtectedRoute>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/download" element={<Download />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const AppContent = () => {
  const { session } = useAuth();

  useScrollRestoration();
  useGestureBack();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setTimeout(() => {
        SplashScreen.hide().catch(() => {});
      }, 500);

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
