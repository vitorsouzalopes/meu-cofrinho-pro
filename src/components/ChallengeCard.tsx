import { Lock, ChevronRight } from "lucide-react";
import type { Challenge } from "@/data/challenges";

interface ChallengeCardProps {
  challenge: Challenge;
  onSelect: (challenge: Challenge) => void;
  isActive?: boolean;
}

const difficultyColors = {
  easy: "text-emerald-accent",
  medium: "text-gold",
  hard: "text-streak",
};

const difficultyLabels = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

const ChallengeCard = ({ challenge, onSelect, isActive }: ChallengeCardProps) => {
  return (
    <button
      onClick={() => !challenge.isPremium && onSelect(challenge)}
      className={`w-full glass-card p-4 flex items-center gap-4 transition-all duration-200 animate-slide-up ${
        challenge.isPremium ? "opacity-70" : ""
      } ${
        isActive 
          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20 scale-[1.02]" 
          : "hover:border-primary/30"
      }`}
    >
      <div className="text-3xl flex-shrink-0">{challenge.icon}</div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-semibold text-foreground text-sm">{challenge.title}</h3>
          {challenge.isPremium && <Lock className="w-3.5 h-3.5 text-gold" />}
          {isActive && (
            <span className="text-[10px] bg-primary/20 text-primary-foreground px-2 py-0.5 rounded-full font-medium ml-auto">
              Participando
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{challenge.description}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {challenge.duration}
          </span>
          <span className={`text-[10px] font-medium ${difficultyColors[challenge.difficulty]}`}>
            {difficultyLabels[challenge.difficulty]}
          </span>
          {challenge.targetAmount > 0 && (
            <span className="text-[10px] text-gold font-medium">
              R${challenge.targetAmount.toLocaleString("pt-BR")}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
};

export default ChallengeCard;
