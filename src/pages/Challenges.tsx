import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { challenges, type Challenge } from "@/data/challenges";
import ChallengeCard from "@/components/ChallengeCard";

const categories = ["Todos", ...new Set(challenges.map((c) => c.category as string))];

const Challenges = () => {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [activeChallengesIds, setActiveChallengesIds] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchActive = async () => {
      try {
        const { data } = await supabase
          .from("user_challenges" as any)
          .select("challenge_id")
          .eq("user_id", user.id)
          .eq("status", "active");
        
        if (data) {
          setActiveChallengesIds(data.map((c: any) => c.challenge_id));
        }
      } catch (err) {
        console.warn("Table user_challenges might not exist yet.");
      }
    };
    fetchActive();
  }, [user]);

  const filtered = activeCategory === "Todos" ? challenges : challenges.filter((c) => c.category === activeCategory);

  const handleSelect = async (challenge: Challenge) => {
    if (!user) {
      toast({ title: "Ops!", description: "Você precisa estar logado para iniciar.", variant: "destructive" });
      return;
    }

    if (activeChallengesIds.includes(challenge.id)) {
      navigate("/progress");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_challenges" as any)
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          status: "active",
          start_date: new Date().toISOString().split("T")[0]
        });

      if (error) throw error;

      toast({ title: "🚀 Desafio Iniciado!", description: `Boa sorte no ${challenge.title}!` });
      setActiveChallengesIds(prev => [...prev, challenge.id]);
      navigate("/progress");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Tabela de desafios inexistente no backend.", variant: "destructive" });
    }
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
            <ChallengeCard 
              challenge={challenge} 
              onSelect={handleSelect}
              isActive={activeChallengesIds.includes(challenge.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Challenges;
