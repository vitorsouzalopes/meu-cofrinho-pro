// Firebase Web SDK config — these are PUBLIC values (safe to commit).
// Substitua pelos valores do seu projeto Firebase em:
//   Console Firebase → Configurações do projeto → Seus apps → Web app
//
// VAPID_KEY: Console Firebase → Cloud Messaging → Web Push certificates → Key pair
export const FIREBASE_CONFIG = {
  apiKey: "REPLACE_ME_API_KEY",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME_PROJECT_ID",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME_SENDER_ID",
  appId: "REPLACE_ME_APP_ID",
};

export const VAPID_KEY = "REPLACE_ME_VAPID_PUBLIC_KEY";

export const isFirebaseConfigured = () =>
  !FIREBASE_CONFIG.apiKey.startsWith("REPLACE_ME") &&
  !VAPID_KEY.startsWith("REPLACE_ME");
