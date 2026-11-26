const CACHE_NAME = 'lithuanian-learning-v6';
const ICON = './icons/icon-192.png';
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
  './vocabulary.json',
  './wordbank-data.json',
  './sentence-builder-data.json',
  './sentences-data.json',
  './css/app.css',
  './fonts/bricolage.woff2',
  './manifest.json',
  './scenario-learning.js',
  './icons/icon-192.png',
  './icons/apple-touch-icon.png'
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
    url: './'
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
      icon: ICON,
      badge: ICON,
      tag: payload.tag || 'daily-reminder',
      data: { url: payload.url || './' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  // Resolve against the app's scope so it works under a GitHub Pages sub-path.
  const targetUrl = new URL(event.notification.data?.url || './', self.registration.scope).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          return client.focus().then(c => (c && 'navigate' in c ? c.navigate(targetUrl) : c));
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
