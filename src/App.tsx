import { useEffect, Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useGestureBack } from "@/hooks/use-gesture-back";
import { App as CapacitorApp } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy loading EVERYTHING to isolate dependencies
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const TooltipProvider = lazy(() => import("@/components/ui/tooltip").then(m => ({ default: m.TooltipProvider })));

const ProtectedLayout = lazy(() => import("./components/layout/AppLayout.tsx").then(m => ({ default: m.ProtectedLayout })));
const AuthRoute = lazy(() => import("./components/layout/AppLayout.tsx").then(m => ({ default: m.AuthRoute })));

const Today = lazy(() => import("./pages/Today.tsx"));
const Accounts = lazy(() => import("./pages/Accounts.tsx"));
const History = lazy(() => import("./pages/History.tsx"));
const Challenges = lazy(() => import("./pages/Challenges.tsx"));
const Progress = lazy(() => import("./pages/Progress.tsx"));
const Ranking = lazy(() => import("./pages/Ranking.tsx"));
const Premium = lazy(() => import("./pages/Premium.tsx"));
const Expenses = lazy(() => import("./pages/Expenses.tsx"));
const TelegramSettings = lazy(() => import("./pages/TelegramSettings.tsx"));
const Download = lazy(() => import("./pages/Download.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const MonthlyAccounts = lazy(() => import("./pages/MonthlyAccounts.tsx"));
const Goals = lazy(() => import("./pages/Goals.tsx"));
const Planner = lazy(() => import("./pages/Planner.tsx"));
const AIConsultant = lazy(() => import("./pages/AIConsultant.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Support = lazy(() => import("./pages/Support.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A]">
    <div className="w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppContent = () => {
  useScrollRestoration();
  useGestureBack();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const t = setTimeout(() => {
        SplashScreen.hide().catch(() => {});
      }, 1500); // More time for React to settle

      const backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });
      return () => {
        clearTimeout(t);
        backListener.then(l => l.remove());
      };
    }
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth" element={
          <Suspense fallback={<PageLoader />}>
            <AuthRoute><Auth /></AuthRoute>
          </Suspense>
        } />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/download" element={<Download />} />

        <Route element={
          <Suspense fallback={<PageLoader />}>
            <ProtectedLayout />
          </Suspense>
        }>
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

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<PageLoader />}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </Suspense>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
