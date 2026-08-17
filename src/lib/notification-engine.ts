import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'prompt' || status.display === 'denied') {
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
    if (display !== 'granted') {
      console.log("[NotificationEngine] No permission to schedule.");
      return;
    }

    // 1. Limpar agendamentos anteriores para evitar duplicidade
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }

    const notifications: any[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 2. Lembrete de Contas (3 dias antes do vencimento)
    if (Array.isArray(data.accounts)) {
      data.accounts.forEach(acc => {
        if (acc && acc.status !== 'pago' && acc.due_day) {
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

    // 3. Resumo de Final de Mês (Último dia do mês às 19:00)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    lastDayOfMonth.setHours(19, 0, 0);

    if (lastDayOfMonth > now) {
      let body = "O mês terminou! Veja o resumo do seu porquinho e prepare o próximo mês.";
      if (data.disponivel < 0) {
        body = `Atenção! Você fechou o mês com R$ ${Math.abs(data.disponivel).toFixed(2)} negativo. Vamos planejar melhor o próximo?`;
      } else if (data.disponivel > 0) {
        body = `Parabéns! Você fechou o mês com R$ ${data.disponivel.toFixed(2)} de saldo livre.`;
      }

      notifications.push({
        id: 999999,
        title: "📊 Resumo do Mês",
        body,
        schedule: { at: lastDayOfMonth },
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
