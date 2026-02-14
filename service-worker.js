const CACHE_NAME = 'lithuanian-learning-v4';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './lessons.js',
  './review.js',
  './notifications.js',
  './streak.js',
  './achievements.js',
  './storage.js',
  './state-logic.js',
  './srs.js',
  './practice.js',
  './sentences.js',
  './sentencebuilder.js',
  './wordbank.js',
  './quests.js',
  './styles.css',
  './learning-system.css',
  './sentences.css',
  './vocabulary.json',
  './wordbank-data.json',
  './sentence-builder-data.json',
  './sentences-data.json',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const cacheableProtocol = requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:';

  if (event.request.method !== 'GET' || !cacheableProtocol) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const networkFetch = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone))
                .catch(() => null)
            );
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (!cacheWhitelist.includes(cacheName)) {
          return caches.delete(cacheName);
        }
        return null;
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('push', event => {
  let payload = {
    title: 'Laikas mokytis! 📚',
    body: 'Your streak is waiting. Practice Lithuanian today.',
    url: '/index.html'
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch (error) {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🇱🇹</text></svg>",
      badge: payload.badge || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🇱🇹</text></svg>",
      tag: payload.tag || 'daily-reminder',
      data: { url: payload.url || '/index.html' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
