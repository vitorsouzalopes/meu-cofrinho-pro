import { useState } from "react";
import { challenges, type Challenge } from "@/data/challenges";
import ChallengeCard from "@/components/ChallengeCard";
import { useNavigate } from "react-router-dom";

const categories = ["Todos", ...new Set(challenges.map((c) => c.category))];

const Challenges = () => {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const navigate = useNavigate();

  const filtered = activeCategory === "Todos" ? challenges : challenges.filter((c) => c.category === activeCategory);

  const handleSelect = (challenge: Challenge) => {
    // In a full app this would start the challenge
    navigate("/progress");
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="font-heading text-xl font-bold text-foreground mb-1">Escolha seu Desafio</h1>
      <p className="text-sm text-muted-foreground mb-4">Comece agora e transforme seus hábitos financeiros.</p>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? "gradient-gold text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Challenge list */}
      <div className="space-y-3">
        {filtered.map((challenge, i) => (
          <div key={challenge.id} style={{ animationDelay: `${i * 0.05}s` }}>
            <ChallengeCard challenge={challenge} onSelect={handleSelect} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Challenges;
