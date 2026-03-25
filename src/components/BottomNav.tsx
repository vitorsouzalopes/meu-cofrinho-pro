import { Home, Target, BarChart3, Trophy, Wallet } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/challenges", icon: Target, label: "Desafios" },
  { path: "/expenses", icon: Wallet, label: "Contas" },
  { path: "/progress", icon: BarChart3, label: "Progresso" },
  { path: "/ranking", icon: Trophy, label: "Ranking" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 px-2 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 py-3 px-3 transition-all duration-200 ${
                isActive ? "text-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_6px_hsl(var(--gold)/0.5)]" : ""}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
