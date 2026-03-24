import { Check } from "lucide-react";

interface CalendarGridProps {
  totalDays: number;
  completedDays: number[];
}

const CalendarGrid = ({ totalDays, completedDays }: CalendarGridProps) => {
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="glass-card p-4">
      <h3 className="font-heading font-semibold text-foreground mb-3">Calendário do Desafio</h3>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isCompleted = completedDays.includes(day);
          const isToday = day === Math.max(...completedDays) + 1;
          return (
            <div
              key={day}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                isCompleted
                  ? "gradient-emerald text-accent-foreground"
                  : isToday
                  ? "border-2 border-primary text-primary animate-pulse-gold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? <Check className="w-3.5 h-3.5" /> : day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
