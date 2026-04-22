import CalendarGrid from "@/components/CalendarGrid";
import ProgressRing from "@/components/ProgressRing";
import { challenges, type Challenge } from "@/data/challenges";
import { TrendingUp, Calendar, Target, Flame, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Progress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeUserChallenges, setActiveUserChallenges] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressData, setProgressData] = useState<Record<string, string[]>>({});

  const activeChallengeData = activeUserChallenges[currentIndex];

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Fetch active challenges
      const { data: userChallenges, error: ucError } = await supabase
        .from("user_challenges" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active") as { data: any[] | null, error: any };

      if (ucError) {
        toast({ title: "Atenção", description: "Inicie um desafio na aba Desafios.", variant: "default" });
      } else if (userChallenges && userChallenges.length > 0) {
        setActiveUserChallenges(userChallenges);
        
        // Fetch progress for all active challenges
        const challengeIds = userChallenges.map(c => (c as any).id);
        const { data: progress, error: pError } = await supabase
          .from("challenge_progress" as any)
          .select("*")
          .in("user_challenge_id", challengeIds);

        if (progress) {
          const grouped = progress.reduce((acc: any, curr: any) => {
            if (!acc[curr.user_challenge_id]) acc[curr.user_challenge_id] = [];
            acc[curr.user_challenge_id].push(curr.status_date);
            return acc;
          }, {});
          setProgressData(grouped);
        }
      }
    } catch(e) {
      console.warn("Challenge tables might not exist", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const currentChallengeInfo = useMemo(() => {
    if (!activeChallengeData) return null;
    return challenges.find(c => c.id === activeChallengeData.challenge_id);
  }, [activeChallengeData]);

  const completedDates = useMemo(() => {
    if (!activeChallengeData) return [];
    return progressData[activeChallengeData.id] || [];
  }, [activeChallengeData, progressData]);

  // Calculations
  const progressPercentage = useMemo(() => {
    if (!currentChallengeInfo || !activeChallengeData) return 0;
    const totalDays = parseInt(currentChallengeInfo.duration) || 30; // fallback depending on type
    const completedDays = completedDates.length;
    return Math.min(100, Math.round((completedDays / totalDays) * 100));
  }, [currentChallengeInfo, completedDates]);

  const totalSaved = useMemo(() => {
    if (!currentChallengeInfo || !activeChallengeData) return 0;
    return completedDates.length * currentChallengeInfo.dailyAmount;
  }, [currentChallengeInfo, completedDates]);

  const currentStreak = useMemo(() => {
    if (completedDates.length === 0) return 0;
    const sorted = [...completedDates].sort().reverse();
    let streak = 0;
    let expectedDate = new Date(); // Start checking from today OR yesterday
    const todayStr = expectedDate.toISOString().split("T")[0];
    
    // Se não fez hoje, check extra se fez ontem para contar streak ativo
    if (sorted[0] !== todayStr) {
       expectedDate.setDate(expectedDate.getDate() - 1);
       if (sorted[0] !== expectedDate.toISOString().split("T")[0]) {
           return 0; // Missed today and yesterday -> streak is 0
       }
    }

    for (let i = 0; i < sorted.length; i++) {
        const dStr = expectedDate.toISOString().split("T")[0];
        if (sorted[i] === dStr) {
            streak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
  }, [completedDates]);

  const handleCheckIn = async () => {
    if (!activeChallengeData || !currentChallengeInfo) return;
    const todayStr = new Date().toISOString().split("T")[0];
    
    if (completedDates.includes(todayStr)) {
      toast({ title: "Já feito!", description: "Você já cumpriu o desafio de hoje." });
      return;
    }

    try {
      const { error } = await supabase
        .from("challenge_progress" as any)
        .insert({
          user_challenge_id: activeChallengeData.id,
          status_date: todayStr,
          amount_saved: currentChallengeInfo.dailyAmount
        });

      if (error) throw error;

      setProgressData(prev => ({
        ...prev,
        [activeChallengeData.id]: [...(prev[activeChallengeData.id] || []), todayStr]
      }));

      toast({ title: "🎉 Check-in realizado!", description: `+${formatCurrency(currentChallengeInfo.dailyAmount)} guardado hoje!` });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const nextChallenge = () => setCurrentIndex(prev => (prev + 1) % activeUserChallenges.length);
  const prevChallenge = () => setCurrentIndex(prev => (prev - 1 + activeUserChallenges.length) % activeUserChallenges.length);

  const isTodayCompleted = completedDates.includes(new Date().toISOString().split("T")[0]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activeUserChallenges.length === 0) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl mb-4">
          🎯
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground mb-2">Nenhum Desafio Ativo</h1>
        <p className="text-sm text-muted-foreground mb-6">Você ainda não está participando de nenhum desafio. Que tal começar um agora?</p>
        <Button onClick={() => navigate("/challenges")}>Explorar Desafios</Button>
      </div>
    );
  }

  if (!currentChallengeInfo) return null;

  const totalDays = parseInt(currentChallengeInfo.duration) || 30;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-xl font-bold text-foreground">Seu Progresso</h1>
        {activeUserChallenges.length > 1 && (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            {currentIndex + 1} de {activeUserChallenges.length}
          </div>
        )}
      </div>

      {/* Challenge Navigation (if multiple) */}
      {activeUserChallenges.length > 1 && (
        <div className="flex items-center justify-between mb-4 bg-muted/50 rounded-full p-1">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={prevChallenge}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-semibold uppercase tracking-wider">{currentChallengeInfo.title}</span>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={nextChallenge}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Progress overview */}
      <Card className="p-6 mb-4 flex items-center gap-6 animate-slide-up border-primary/20 bg-primary/5">
        <ProgressRing progress={progressPercentage} size={100} strokeWidth={6}>
          <div className="text-center">
            <p className="font-heading text-xl font-bold text-foreground">{progressPercentage}%</p>
          </div>
        </ProgressRing>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Desafio Atual</p>
          <h2 className="font-heading font-semibold text-foreground mt-1">
            {currentChallengeInfo.icon} {currentChallengeInfo.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 text-primary">
            {completedDates.length} de {totalDays} dias concluídos
          </p>
        </div>
      </Card>

      {/* Action Button */}
      <Button 
        className={`w-full mb-6 font-semibold py-6 text-base ${isTodayCompleted ? 'bg-primary/20 text-primary hover:bg-primary/20' : 'animate-pulse-gold'}`}
        onClick={handleCheckIn}
        disabled={isTodayCompleted}
      >
        {isTodayCompleted ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Feito Hoje
          </div>
        ) : (
           <div className="flex items-center gap-2">
             <Target className="w-5 h-5" /> Marcar como Feito
           </div>
        )}
      </Button>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4 animate-slide-up border-gold/30" style={{ animationDelay: `0.1s` }}>
          <TrendingUp className="w-4 h-4 text-gold mb-2" />
          <p className="font-heading font-bold text-lg text-gold">{formatCurrency(totalSaved)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total guardado</p>
        </Card>
        
        <Card className="p-4 animate-slide-up border-streak/30" style={{ animationDelay: `0.2s` }}>
          <Flame className="w-4 h-4 text-streak mb-2" />
          <p className="font-heading font-bold text-lg text-streak">{currentStreak} dias</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak atual</p>
        </Card>
      </div>

      {/* Calendar */}
      <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h3 className="font-heading text-sm font-semibold mb-3">Histórico de Conclusão</h3>
        <CalendarGrid totalDays={totalDays} completedDays={completedDates} />
      </div>
    </div>
  );
};

export default Progress;
