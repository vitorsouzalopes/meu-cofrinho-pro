export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  duration: string;
  targetAmount: number;
  dailyAmount?: number;
  weeklyAmount?: number;
  difficulty: "easy" | "medium" | "hard";
  isPremium: boolean;
  category: string;
}

export const challenges: Challenge[] = [
  {
    id: "daily-2",
    title: "Guardar R$2 por dia",
    description: "Comece pequeno! Guarde R$2 todos os dias e veja o montante crescer.",
    icon: "🪙",
    duration: "30 dias",
    targetAmount: 60,
    dailyAmount: 2,
    difficulty: "easy",
    isPremium: false,
    category: "Diário",
  },
  {
    id: "daily-5",
    title: "Guardar R$5 por dia",
    description: "Um café a menos por dia pode mudar sua vida financeira.",
    icon: "☕",
    duration: "30 dias",
    targetAmount: 150,
    dailyAmount: 5,
    difficulty: "easy",
    isPremium: false,
    category: "Diário",
  },
  {
    id: "weekly-10",
    title: "Guardar R$10 por semana",
    description: "Separe R$10 toda semana e construa uma reserva.",
    icon: "📅",
    duration: "12 semanas",
    targetAmount: 120,
    weeklyAmount: 10,
    difficulty: "easy",
    isPremium: false,
    category: "Semanal",
  },
  {
    id: "52-weeks",
    title: "Desafio 52 Semanas",
    description: "Semana 1 = R$1, Semana 2 = R$2... Semana 52 = R$52. Total: R$1.378!",
    icon: "📈",
    duration: "52 semanas",
    targetAmount: 1378,
    difficulty: "medium",
    isPremium: false,
    category: "Progressivo",
  },
  {
    id: "no-spend",
    title: "Desafio Sem Gastar",
    description: "Fique 7 dias sem gastos desnecessários. Só o essencial!",
    icon: "🚫",
    duration: "7 dias",
    targetAmount: 0,
    difficulty: "medium",
    isPremium: false,
    category: "Comportamental",
  },
  {
    id: "meta-1000",
    title: "Meta R$1.000",
    description: "Estabeleça sua meta e guarde até atingir R$1.000.",
    icon: "🎯",
    duration: "Flexível",
    targetAmount: 1000,
    difficulty: "hard",
    isPremium: false,
    category: "Meta",
  },
  {
    id: "pay-debt",
    title: "Quitar Dívida",
    description: "Organize e pague suas dívidas com um plano estruturado.",
    icon: "💳",
    duration: "Flexível",
    targetAmount: 0,
    difficulty: "hard",
    isPremium: true,
    category: "Dívidas",
  },
  {
    id: "emergency",
    title: "Reserva de Emergência",
    description: "Construa sua reserva de emergência de 3 meses de gastos.",
    icon: "🛡️",
    duration: "6 meses",
    targetAmount: 5000,
    difficulty: "hard",
    isPremium: true,
    category: "Segurança",
  },
];

export interface UserProgress {
  challengeId: string;
  completedDays: number[];
  totalSaved: number;
  streak: number;
  startDate: string;
}

export const mockProgress: UserProgress = {
  challengeId: "daily-5",
  completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15],
  totalSaved: 70,
  streak: 5,
  startDate: "2026-03-10",
};

export interface UserStats {
  totalSaved: number;
  currentStreak: number;
  longestStreak: number;
  challengesCompleted: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  medals: string[];
}

export const mockStats: UserStats = {
  totalSaved: 847.5,
  currentStreak: 5,
  longestStreak: 14,
  challengesCompleted: 3,
  level: 7,
  xp: 680,
  xpToNextLevel: 1000,
  medals: ["🥇", "🔥", "💪", "⭐"],
};
