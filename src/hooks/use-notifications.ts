import { useEffect, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export function useNotifications() {
  const [status, setStatus] = useState<string>('loading');

  const checkPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      setStatus('web');
      return;
    }

    try {
      const { display } = await LocalNotifications.checkPermissions();
      setStatus(display);
    } catch (e) {
      console.error("Error checking notifications:", e);
      setStatus('error');
    }
  };

  const requestPermission = async () => {
    if (!Capacitor.isNativePlatform()) return true;

    try {
      const { display } = await LocalNotifications.requestPermissions();
      setStatus(display);
      return display === 'granted';
    } catch (e) {
      console.error("Error requesting notifications:", e);
      setStatus('error');
      return false;
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return { status, requestPermission, checkPermission };
}
