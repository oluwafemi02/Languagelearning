const CACHE_NAME = 'lithuanian-learning-v3';
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

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const networkFetch = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});

// Activate event
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
