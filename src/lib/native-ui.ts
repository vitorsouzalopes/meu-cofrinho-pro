import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

export const hapticImpact = async (style: ImpactStyle = ImpactStyle.Medium) => {
  if (Capacitor.isNativePlatform()) {
    try { await Haptics.impact({ style }); } catch { /* noop */ }
  }
};

export const hapticNotification = async (type: NotificationType = NotificationType.Success) => {
  if (Capacitor.isNativePlatform()) {
    try { await Haptics.notification({ type }); } catch { /* noop */ }
  }
};

export const hapticSelection = async () => {
  if (Capacitor.isNativePlatform()) {
    try { await Haptics.selectionStart(); } catch { /* noop */ }
  }
};

export const setStatusBarColor = async (color: string, isDark: boolean) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.setBackgroundColor({ color });
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    } catch { /* noop */ }
  }
};
