import CalendarGrid from "@/components/CalendarGrid";
import ProgressRing from "@/components/ProgressRing";
import { mockProgress, mockStats, challenges } from "@/data/challenges";
import { TrendingUp, Calendar, Target, Flame } from "lucide-react";

const Progress = () => {
  const currentChallenge = challenges.find((c) => c.id === mockProgress.challengeId)!;
  const progress = Math.round((mockProgress.completedDays.length / 30) * 100);

  const stats = [
    { icon: TrendingUp, label: "Total guardado", value: `R$${mockStats.totalSaved}`, color: "text-gold" },
    { icon: Flame, label: "Streak atual", value: `${mockStats.currentStreak} dias`, color: "text-streak" },
    { icon: Target, label: "Desafios feitos", value: mockStats.challengesCompleted.toString(), color: "text-emerald-accent" },
    { icon: Calendar, label: "Maior streak", value: `${mockStats.longestStreak} dias`, color: "text-foreground" },
  ];

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="font-heading text-xl font-bold text-foreground mb-4">Seu Progresso</h1>

      {/* Progress overview */}
      <div className="glass-card p-6 mb-4 flex items-center gap-6 animate-slide-up">
        <ProgressRing progress={progress} size={100} strokeWidth={6}>
          <div className="text-center">
            <p className="font-heading text-xl font-bold text-foreground">{progress}%</p>
          </div>
        </ProgressRing>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Desafio Atual</p>
          <h2 className="font-heading font-semibold text-foreground mt-1">
            {currentChallenge.icon} {currentChallenge.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mockProgress.completedDays.length} de 30 dias concluídos
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.map(({ icon: Icon, label, value, color }, i) => (
          <div key={label} className="glass-card p-4 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className={`font-heading font-bold text-lg ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <CalendarGrid totalDays={30} completedDays={mockProgress.completedDays} />
      </div>
    </div>
  );
};

export default Progress;
