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
import NotFound from "./pages/NotFound.tsx";

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
    <Route path="/allocation" element={<ProtectedRoute><Allocation /></ProtectedRoute>} />
    <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
    <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
    <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
    <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
    <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
    <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
    <Route path="/telegram" element={<ProtectedRoute><TelegramSettings /></ProtectedRoute>} />
    <Route path="/download" element={<Download />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const AppContent = () => {
  const { session } = useAuth();
  useScrollRestoration();
  useGestureBack();
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
