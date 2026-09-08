import { registerPlugin } from '@capacitor/core';

export interface NotificationPermissionPlugin {
  checkStatus(): Promise<{ status: 'granted' | 'prompt' | 'denied' }>;
  requestPermission(): Promise<{ status: 'granted' | 'denied' }>;
}

const NotificationPermission = registerPlugin<NotificationPermissionPlugin>('NotificationPermission');

export default NotificationPermission;

/**
 * Helper to check and request if needed, unified for the whole app
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await NotificationPermission.checkStatus();
    if (status === 'granted') return true;

    const request = await NotificationPermission.requestPermission();
    return request.status === 'granted';
  } catch (e) {
    console.error('[NativePermission] Bridge failed:', e);
    return false;
  }
}
