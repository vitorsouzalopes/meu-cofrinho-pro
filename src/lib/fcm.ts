import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, deleteToken } from "firebase/messaging";
import { supabase } from "@/integrations/supabase/client";
import { FIREBASE_CONFIG, VAPID_KEY, isFirebaseConfigured } from "@/constants/firebase";

let appInstance: ReturnType<typeof initializeApp> | null = null;

const getApp = () => {
  if (appInstance) return appInstance;
  appInstance = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
  return appInstance;
};

export async function enableFcmPush(userId: string): Promise<{ ok: boolean; reason?: string; token?: string }> {
  try {
    if (!isFirebaseConfigured()) {
      return { ok: false, reason: "Firebase não está configurado. Atualize src/constants/firebase.ts e public/firebase-messaging-sw.js." };
    }
    if (!(await isSupported())) {
      return { ok: false, reason: "Push não suportado neste navegador." };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: "Permissão de notificação negada." };
    }

    // 1. Get or register Service Worker
    let swReg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    if (!swReg) {
      console.log("FCM: Registering new service worker...");
      swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
    }

    // 2. Wait for it to be ready (has an active worker)
    const activeReg = await navigator.serviceWorker.ready;
    
    // 3. Ensure the worker is truly 'activated' (not just active)
    // If it's still installing or waiting, wait for it.
    if (!activeReg.active) {
       return { ok: false, reason: "Service worker não pôde ser ativado." };
    }

    // Small delay to ensure browser context is ready for push subscription
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const messaging = getMessaging(getApp());
    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY, 
      serviceWorkerRegistration: activeReg 
    });

    if (!token) return { ok: false, reason: "Não foi possível obter token FCM (token vazio)." };

    // upsert by token (unique)
    const { error } = await supabase
      .from("fcm_tokens")
      .upsert(
        { user_id: userId, token, platform: "web", user_agent: navigator.userAgent },
        { onConflict: "token" },
      );

    if (error) return { ok: false, reason: error.message };
    return { ok: true, token };
  } catch (err: any) {
    return { ok: false, reason: err?.message || String(err) };
  }
}

export async function disableFcmPush(userId: string) {
  try {
    if (await isSupported()) {
      const messaging = getMessaging(getApp());
      try { await deleteToken(messaging); } catch { /* noop */ }
    }
    await supabase.from("fcm_tokens").delete().eq("user_id", userId);
  } catch (err) {
    console.warn("disableFcmPush:", err);
  }
}
