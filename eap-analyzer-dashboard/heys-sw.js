// Простой Service Worker для EAP Analyzer Dashboard
const CACHE_NAME = 'eap-dashboard-v1';
const urlsToCache = [
  '/',
  '/css/styles.css',
  '/js/dashboard.js',
  '/js/components.js',
  '/js/charts.js',
  '/js/parser.js',
];

// Install event
self.addEventListener('install', event => {
  console.log('[SW] Service Worker установлен');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Кеширование файлов');
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Возвращаем кешированный ответ, если есть, иначе делаем сетевой запрос
      if (response) {
        console.log('[SW] Ответ из кеша:', event.request.url);
        return response;
      }

      console.log('[SW] Сетевой запрос:', event.request.url);
      return fetch(event.request);
    })
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('[SW] Service Worker активирован');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Удаление старого кеша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
