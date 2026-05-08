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

    let swReg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    if (!swReg) {
      swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }
    
    // Aguarda o Service Worker estar pronto e ativo
    await navigator.serviceWorker.ready;

    // Garantir que o Service Worker está ativado antes de pedir o token
    const worker = swReg.installing || swReg.waiting;
    if (worker) {
      await new Promise<void>((resolve) => {
        worker.addEventListener("statechange", (e: any) => {
          if (e.target.state === "activated") resolve();
        });
      });
    }

    const messaging = getMessaging(getApp());
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });

    if (!token) return { ok: false, reason: "Não foi possível obter token FCM." };

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
