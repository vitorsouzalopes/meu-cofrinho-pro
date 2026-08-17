import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'prompt') {
      const request = await LocalNotifications.requestPermissions();
      return request.display === 'granted';
    }
    return status.display === 'granted';
  } catch (e) {
    console.error("Error requesting notifications:", e);
    return false;
  }
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
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') return;

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
    if (Array.isArray(data.accounts)) {
      data.accounts.forEach(acc => {
        if (acc && acc.status !== 'pago' && acc.due_day) {
          // Simplificação: Assume que a conta vence no mês atual
          const due = new Date(currentYear, currentMonth, acc.due_day);
          const alertDate = new Date(due);
          alertDate.setDate(due.getDate() - 3);
          alertDate.setHours(9, 0, 0); // 9h da manhã

          if (alertDate > now) {
            notifications.push({
              id: Math.abs(Math.floor(Math.random() * 1000000)),
              title: "⏰ Conta próxima do vencimento",
              body: `Sua conta "${acc.nome || 'Pendente'}" vence em 3 dias. Não esqueça de pagar!`,
              schedule: { at: alertDate },
              extra: { type: 'bill-reminder' }
            });
          }
        }
      });
    }

    // 3. Recapitulação de Final de Mês (Dia 28 às 10h)
    const recapDate = new Date(currentYear, currentMonth, 28, 10, 0, 0);
    if (recapDate > now) {
      let body = "O mês está acabando! Veja como ficaram suas economias.";
      if (data.disponivel < 0) {
        body = "Atenção! Seu saldo do mês está negativo. Abra o app para ajustar.";
      } else if (data.disponivel > 500) {
        body = "Parabéns! Você tem um bom saldo sobrando. Que tal investir em uma meta?";
      }

      notifications.push({
        id: 888888,
        title: "📊 Resumo do Mês",
        body,
        schedule: { at: recapDate },
        extra: { type: 'monthly-recap' }
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
