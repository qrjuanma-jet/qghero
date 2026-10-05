const CACHE_NAME = 'qghero-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/icon.svg',
  '/src/main.js',
  '/src/groqApi.js',
  '/src/gameEngine.js',
  '/src/audioSynth.js',
  '/src/chordDb.js',
  '/src/chordUI.js',
  '/src/theoryMode.js',
  '/src/practiceMode.js',
  '/src/dictionaryMode.js',
  '/src/scoreViewer.js',
  '/src/share.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('[SW] Fallo al precachear algunas rutas:', err);
        });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Purgando caché obsoleta:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Las llamadas a APIs externas (Groq, YouTube) nunca se interceptan en caché
  if (event.request.url.includes('api.groq.com') || event.request.url.includes('youtube.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

