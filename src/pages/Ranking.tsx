import { Trophy, Medal, TrendingUp } from "lucide-react";

interface RankingItem {
  name: string;
  saved: number;
  streak: number;
  level: number;
  avatar: string;
  isUser?: boolean;
}

const rankingData: RankingItem[] = [
  { name: "Ana Silva", saved: 2340, streak: 45, level: 12, avatar: "🦊" },
  { name: "Carlos M.", saved: 1890, streak: 32, level: 10, avatar: "🦁" },
  { name: "Julia R.", saved: 1560, streak: 28, level: 9, avatar: "🐼" },
  { name: "Você", saved: 847.5, streak: 5, level: 7, avatar: "🐯", isUser: true },
  { name: "Pedro L.", saved: 720, streak: 12, level: 6, avatar: "🐨" },
  { name: "Maria F.", saved: 540, streak: 8, level: 5, avatar: "🦄" },
  { name: "Lucas S.", saved: 320, streak: 4, level: 3, avatar: "🐸" },
];

const podiumColors = ["text-gold", "text-muted-foreground", "text-streak"];
const podiumIcons = [Trophy, Medal, Medal];

const Ranking = () => {
  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="font-heading text-xl font-bold text-foreground mb-1">Ranking</h1>
      <p className="text-sm text-muted-foreground mb-6">Veja como você está em relação a outros poupadores.</p>

      {/* Top 3 podium */}
      <div className="flex items-end justify-center gap-3 mb-6">
        {[1, 0, 2].map((index) => {
          const user = rankingData[index];
          const Icon = podiumIcons[index];
          const isFirst = index === 0;
          return (
            <div key={index} className={`flex flex-col items-center ${isFirst ? "mb-4" : ""}`}>
              <div className={`text-3xl mb-1 ${isFirst ? "text-4xl" : ""}`}>{user.avatar}</div>
              <Icon className={`w-5 h-5 ${podiumColors[index]} mb-1`} />
              <p className="text-xs font-semibold text-foreground text-center">{user.name}</p>
              <p className="text-[10px] text-gold font-medium">R${user.saved.toLocaleString("pt-BR")}</p>
              <div className={`mt-2 w-20 rounded-t-lg ${
                isFirst ? "h-24 gradient-gold" : index === 1 ? "h-16 bg-muted" : "h-12 bg-muted"
              } flex items-center justify-center`}>
                <span className={`font-heading font-bold text-lg ${isFirst ? "text-primary-foreground" : "text-foreground"}`}>
                  {index + 1}º
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full list */}
      <div className="space-y-2">
        {rankingData.map((user, i) => (
          <div
            key={i}
            className={`glass-card p-3 flex items-center gap-3 animate-slide-up ${
              user.isUser ? "border-primary/30 glow-gold" : ""
            }`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <span className="text-sm font-heading font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
            <span className="text-2xl">{user.avatar}</span>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${user.isUser ? "text-gold" : "text-foreground"}`}>
                {user.name}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>Nv.{user.level}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> {user.streak} dias
                </span>
              </div>
            </div>
            <p className="text-sm font-heading font-semibold text-gold">
              R${user.saved.toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ranking;
