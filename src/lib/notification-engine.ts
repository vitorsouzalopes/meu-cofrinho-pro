import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return true;
  const status = await LocalNotifications.requestPermissions();
  return status.display === 'granted';
}

/**
 * Agendar notificações baseadas no estado financeiro atual
 */
export async function scheduleFinancialReminders(data: {
  accounts: any[],
  salary: number,
  goals: any[],
  disponivel: number
}) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Limpar agendamentos anteriores para evitar duplicidade
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }

    const notifications: any[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 2. Lembrete de Contas (3 dias antes)
    data.accounts.forEach(acc => {
      if (acc.status !== 'pago' && acc.due_day) {
        const due = new Date(currentYear, currentMonth, acc.due_day);
        const alertDate = new Date(due);
        alertDate.setDate(due.getDate() - 3);
        alertDate.setHours(9, 0, 0); // 9h da manhã

        if (alertDate > now) {
          notifications.push({
            id: Math.floor(Math.random() * 100000),
            title: "⏰ Conta próxima do vencimento",
            body: `Sua conta "${acc.nome}" de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.valor)} vence em 3 dias.`,
            schedule: { at: alertDate },
          });
        }
      }
    });

    // 3. Lembrete de Metas (Próximo do deadline se houver)
    data.goals.forEach(goal => {
      if (goal.deadline && goal.status === 'active') {
        const deadline = new Date(goal.deadline);
        const alertDate = new Date(deadline);
        alertDate.setDate(deadline.getDate() - 7); // 1 semana antes
        alertDate.setHours(10, 0, 0);

        if (alertDate > now) {
          notifications.push({
            id: Math.floor(Math.random() * 100000) + 100000,
            title: "🎯 Meta se aproximando",
            body: `Sua meta "${goal.name}" está próxima do prazo final. Como está o porquinho?`,
            schedule: { at: alertDate },
          });
        }
      }
    });

    // 4. Recebimento de Salário (Notificar se houver saldo positivo ignorando contas pagas)
    if (data.salary > 0) {
      notifications.push({
        id: 999,
        title: "💰 Salário Detectado",
        body: `Seu salário foi registrado. Você tem ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.disponivel)} de dinheiro livre para o mês.`,
        schedule: { at: new Date(Date.now() + 10000) }, // 10 segundos após carregar
      });
    }

    // 4. Recapitulação de Final de Mês (Último dia do mês as 18h)
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    lastDay.setHours(18, 0, 0);

    if (lastDay > now) {
      const unpaid = data.accounts.filter(a => a.status !== 'pago');
      let body = "Mês concluído! Todas as suas contas foram pagas. 🎉";

      if (unpaid.length > 0) {
        body = `Ainda restam ${unpaid.length} contas pendentes. `;
        if (data.disponivel < 0) {
          body += "Atenção: seu saldo está negativo! Use o Planejador para ajustar.";
        } else {
          body += "Você tem saldo suficiente. Não esqueça de pagar!";
        }
      }

      notifications.push({
        id: 888,
        title: "📊 Resumo do Mês",
        body,
        schedule: { at: lastDay },
      });
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.log(`[NotificationEngine] Scheduled ${notifications.length} notifications.`);
    }
  } catch (err) {
    console.error("[NotificationEngine] Error scheduling:", err);
  }
}
