import { Home, Wallet, Target, TrendingUp, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { hapticImpact } from "@/lib/native-ui";
import { ImpactStyle } from "@capacitor/haptics";

const navItems = [
  { path: "/", icon: Home, label: "Hoje" },
  { path: "/accounts", icon: Wallet, label: "Contas" },
  { path: "/progress", icon: TrendingUp, label: "Progresso" },
  { path: "/goals", icon: Target, label: "Metas" },
  { path: "/profile", icon: User, label: "Perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/40 px-1 pb-safe-offset-2"
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-between max-w-lg mx-auto h-20">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => {
                hapticImpact(ImpactStyle.Light);
                navigate(path);
              }}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300 relative ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground/60 hover:text-foreground"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-b-full shadow-[0_2px_10px_rgba(16,185,129,0.5)]" />
              )}
              <Icon
                className={`w-4.5 h-4.5 transition-transform duration-300 ${isActive ? "scale-110" : "scale-100"}`}
                aria-hidden="true"
              />
              <span className={`text-[8px] font-bold tracking-tight ${isActive ? "opacity-100" : "opacity-80"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
