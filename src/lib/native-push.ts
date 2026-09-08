import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token } from '@capacitor/push-notifications';
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

    // 2. Setup listeners BEFORE registering
    await PushNotifications.removeAllListeners();

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

    // 3. Trigger native registration
    await PushNotifications.register();

    return await registrationPromise;
  } catch (e) {
    console.error('[Push] Fatal flow error:', e);
    return { status: 'error' };
  }
}
