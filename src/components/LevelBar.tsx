interface LevelBarProps {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

const LevelBar = ({ level, xp, xpToNextLevel }: LevelBarProps) => {
  const progress = (xp / xpToNextLevel) * 100;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎮</span>
          <span className="font-heading font-semibold text-foreground">Nível {level}</span>
        </div>
        <span className="text-xs text-muted-foreground">{xp}/{xpToNextLevel} XP</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full gradient-gold rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default LevelBar;
