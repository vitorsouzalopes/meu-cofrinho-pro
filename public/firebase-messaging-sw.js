// Firebase Cloud Messaging service worker
// IMPORTANTE: substitua os valores em src/constants/firebase.ts E aqui (são scripts separados).
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDBXR2MqYFN0d_TBcWKV89juD6Mhz9se0M",
  authDomain: "cofrinho-pro.firebaseapp.com",
  projectId: "cofrinho-pro",
  storageBucket: "cofrinho-pro.firebasestorage.app",
  messagingSenderId: "69071518647",
  appId: "1:69071518647:web:21d69da7742258eee88632",
  measurementId: "G-3G8TQLSD59"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Meu Cofrinho';
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/icon-192.png',
    badge: '/favicon.ico',
    data: { url: payload.data?.url || '/' },
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
