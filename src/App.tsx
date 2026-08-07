import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useGestureBack } from "@/hooks/use-gesture-back";
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
import Support from "./pages/Support.tsx";
import { ProtectedLayout, AuthRoute } from "./components/layout/AppLayout.tsx";

const queryClient = new QueryClient();

const AppContent = () => {
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
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/download" element={<Download />} />

      {/* Rotas Protegidas (Envelope Único) */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Today />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/monthly-accounts" element={<MonthlyAccounts />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/history" element={<History />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/telegram" element={<TelegramSettings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ai-consultant" element={<AIConsultant />} />
        <Route path="/support" element={<Support />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
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
