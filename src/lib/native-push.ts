import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from "@/integrations/supabase/client";

export async function registerNativePush(userId: string): Promise<{ status: string }> {
  if (!Capacitor.isNativePlatform()) return { status: 'web' };

  try {
    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'denied') {
      return { status: 'denied' };
    }

    if (permStatus.receive === 'prompt') {
      const request = await PushNotifications.requestPermissions();
      if (request.receive !== 'granted') return { status: request.receive };
    }

    // IMPORTANT: Attach listeners BEFORE calling register() to avoid race conditions
    // Token might be delivered instantly if already cached by OS

    await PushNotifications.removeAllListeners();

    PushNotifications.addListener('registration', async (token) => {
      console.log('[Push] Registration success. Token:', token.value);
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
          console.log('[Push] Token saved to Supabase successfully.');
        }
      } catch (err) {
        console.error('[Push] Supabase Error:', err);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] Registration error:', error);
    });

    // After listeners are ready, trigger registration
    await PushNotifications.register();

    return { status: 'granted' };
  } catch (e) {
    console.error('[Push] Fatal Error:', e);
    return { status: 'error' };
  }
}
