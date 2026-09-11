import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { supabase } from "@/integrations/supabase/client";
import { ensureNotificationPermission } from './native-notification-permission';

export async function registerNativePush(userId: string): Promise<{ status: string }> {
  if (!Capacitor.isNativePlatform()) return { status: 'web' };

  try {
    // 1. Use the custom bridge to handle Android 13+ runtime dialog
    const granted = await ensureNotificationPermission();
    if (!granted) {
      console.log('[Push] Permission denied by user');
      return { status: 'denied' };
    }

    // 2. Create Notification Channel (Android 8+)
    // Without a channel, notifications might be delivered but not shown.
    try {
      await PushNotifications.createChannel({
        id: 'default',
        name: 'Padrão',
        description: 'Notificações gerais do app',
        importance: 5, // High importance
        visibility: 1, // Public
        vibration: true,
      });
      console.log('[Push] Notification channel "default" ensured.');
    } catch (channelErr) {
      console.warn('[Push] Failed to create notification channel:', channelErr);
    }

    // 3. Setup listeners BEFORE registering
    await PushNotifications.removeAllListeners();

    // Listener for when a notification is received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('[Push] Notification received in foreground:', notification);
    });

    // Listener for when a user performs an action on a notification (clicks it)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('[Push] Notification action performed:', notification);
      // Optional: handle navigation based on notification data
    });

    // Wrap registration in a promise to handle success/error/timeout
    const registrationPromise = new Promise<{ status: string }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn('[Push] Registration timed out after 10s');
        resolve({ status: 'timeout' });
      }, 10000);

      PushNotifications.addListener('registration', async (token: Token) => {
        clearTimeout(timeout);
        console.log('[Push] Registration success. Token obtained.');

        try {
          const { error } = await supabase.from('fcm_tokens').upsert({
            user_id: userId,
            token: token.value,
            platform: Capacitor.getPlatform(),
            user_agent: navigator.userAgent
          }, { onConflict: 'token' });

          if (error) {
            console.error('[Push] Supabase Upsert Error:', error.message);
          } else {
            console.log('[Push] Token persisted to database.');
          }
          resolve({ status: 'granted' });
        } catch (err) {
          console.error('[Push] Database Error:', err);
          resolve({ status: 'granted' }); // Still granted, just not persisted
        }
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        clearTimeout(timeout);
        console.error('[Push] Firebase Error:', error);
        reject(error);
      });
    });

    // 4. Trigger native registration
    await PushNotifications.register();

    return await registrationPromise;
  } catch (e) {
    console.error('[Push] Fatal flow error:', e);
    return { status: 'error' };
  }
}
