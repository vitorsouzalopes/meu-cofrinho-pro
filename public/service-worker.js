// service-worker.js — cache-first for images, network-first for everything else
const CACHE_NAME = 'cofrinho-cache-v1';

self.addEventListener('install', event => {
  console.log('[SW] Installing');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name.startsWith('cofrinho-cache-') && name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isImage = /\.(png|jpg|jpeg|gif|svg|webp|ico)(\?.*)?$/i.test(url.pathname);

  if (isImage) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  } else {
    // JS, HTML, JSON, API — always network
    event.respondWith(fetch(event.request));
  }
});

// Listen for skip waiting message from app
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// PWA Push Notifications
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Meu Cofrinho', options)
    );
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
