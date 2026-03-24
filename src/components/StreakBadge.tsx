import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

const StreakBadge = ({ streak }: StreakBadgeProps) => {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border/50">
      <Flame className="w-4 h-4 text-streak animate-pulse-gold" />
      <span className="text-sm font-semibold font-heading text-foreground">{streak}</span>
      <span className="text-xs text-muted-foreground">dias</span>
    </div>
  );
};

export default StreakBadge;
