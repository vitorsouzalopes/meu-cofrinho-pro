export interface RiskInput {
  hydration: number;
  sleep: number;
  meals: number;
  weightChange: number;
  activity: number;
  frequency: number;
}

export type RiskLevel = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const calculateRiskScore = ({
  hydration,
  sleep,
  meals,
  weightChange,
  activity,
  frequency,
}: RiskInput): number => {
  const weightImpact = clamp(Math.abs(weightChange) * 110, 0, 25);
  const score =
    (1 - hydration) * 25 +
    (1 - sleep) * 20 +
    (1 - meals) * 20 +
    weightImpact +
    (1 - activity) * 15 +
    (1 - frequency) * 15;

  return clamp(Math.round(score), 0, 100);
};

export const getRiskLevel = (score: number): RiskLevel => {
  if (score >= 85) return 'Crítico';
  if (score >= 65) return 'Alto';
  if (score >= 35) return 'Médio';
  return 'Baixo';
};

export const buildTodaySnapshot = () => {
  const score = calculateRiskScore({
    hydration: 0.4,
    sleep: 0.55,
    meals: 0.3,
    weightChange: -0.06,
    activity: 0.25,
    frequency: 0.4,
  });

  const level = getRiskLevel(score);

  return {
    score,
    risk: {
      level,
      description:
        level === 'Crítico'
          ? 'O paciente precisa de revisão imediata para evitar deterioração clínica.'
          : level === 'Alto'
            ? 'Há sinais de descompensação e a equipe deve reforçar o acompanhamento.'
            : level === 'Médio'
              ? 'O comportamento ainda precisa de atenção para permanecer estável.'
              : 'O paciente segue com uma rotina estável e boa adesão.',
    },
    alerts: [
      'Paciente ficou 3 dias sem registrar refeições.',
      'Meta de água não foi atingida no último ciclo.',
      'Atenção a tendência de abandono do plano de exercícios.',
    ],
    actions: ['Plano alimentar', 'Meta de água', 'Consulta marcada', 'Mensagem do profissional'],
    schedule: [
      { label: 'Consulta online', time: '14:00' },
      { label: 'Revisão nutricional', time: '16:30' },
      { label: 'Check-in de sono', time: '21:00' },
    ],
  };
};
