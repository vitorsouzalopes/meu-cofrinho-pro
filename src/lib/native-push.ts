import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from "@/integrations/supabase/client";

export async function registerNativePush(userId: string): Promise<{ status: string }> {
  if (!Capacitor.isNativePlatform()) return { status: 'web' };

  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    console.warn('User denied permissions for push notifications');
    return { status: permStatus.receive };
  }

  try {
    await PushNotifications.register();

    await PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);

      const { error } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_id: userId,
          token: token.value,
          platform: Capacitor.getPlatform(),
          user_agent: navigator.userAgent
        }, { onConflict: 'token' });

      if (error) {
        console.error('Error saving push token to Supabase:', error);
      }
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on push registration: ' + JSON.stringify(error));
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });

    return { status: 'granted' };
  } catch (e) {
    console.error('FCM Error:', e);
    return { status: 'error' };
  }
}
