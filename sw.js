const CACHE_NAME = 'caveman-adventure-v1.4';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=1.4',
  './game.js?v=1.3',
  './sprites.js?v=1.2',
  './audio.js?v=1.2',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './thumbnail.png'
];

// Install Event - cache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all app shell assets');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First with Cache Fallback
self.addEventListener('fetch', (e) => {
  // Only handle local GET requests (skip external resources like Firebase RTDB to avoid issues)
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If response is valid, update the cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fetch failed (offline) - try to serve from cache
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fail gracefully if not found
          return new Response('Offline and resource not cached.', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
