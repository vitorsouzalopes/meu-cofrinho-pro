// Firebase Web SDK config — these are PUBLIC values (safe to commit).
// Substitua pelos valores do seu projeto Firebase em:
//   Console Firebase → Configurações do projeto → Seus apps → Web app
//
// VAPID_KEY: Console Firebase → Cloud Messaging → Web Push certificates → Key pair
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDBXR2MqYFN0d_TBcWKV89juD6Mhz9se0M",
  authDomain: "cofrinho-pro.firebaseapp.com",
  projectId: "cofrinho-pro",
  storageBucket: "cofrinho-pro.firebasestorage.app",
  messagingSenderId: "69071518647",
  appId: "1:69071518647:web:21d69da7742258eee88632",
  measurementId: "G-3G8TQLSD59"
};

export const VAPID_KEY = "REPLACE_ME_VAPID_PUBLIC_KEY";

export const isFirebaseConfigured = () =>
  !FIREBASE_CONFIG.apiKey.startsWith("REPLACE_ME") &&
  !VAPID_KEY.startsWith("REPLACE_ME");
