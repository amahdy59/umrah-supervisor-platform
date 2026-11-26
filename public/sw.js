const CACHE_NAME = 'umrah-companion-v15';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/supervisor.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  // Self-hosted Cairo font subsets (no CDN dependency)
  '/fonts/cairo/cairo-arabic.woff2',
  '/fonts/cairo/cairo-latin-ext.woff2',
  '/fonts/cairo/cairo-latin.woff2',
  // Offline audio feedback & dhikr clips
  '/audio/lap-chime.wav',
  '/audio/talbiyah.mp3',
  '/audio/rukn-yamani.mp3',
  '/audio/safa-marwah.mp3',
  // Makkah images
  '/images/makkah/kaaba-door.webp',
  '/images/makkah/kaaba-courtyard.webp',
  '/images/makkah/gate-abdulaziz.webp',
  '/images/makkah/gate-fahd.webp',
  '/images/makkah/king-abdullah-gate.webp',
  '/images/makkah/bab-al-umrah.webp',
  '/images/makkah/gate-main-entrance.webp',
  '/images/makkah/safa-marwah-masa.webp',
  '/images/makkah/zamzam-stations.webp',
  '/images/makkah/jabal-al-nour.webp',
  '/images/makkah/jabal-thawr.webp',
  '/images/makkah/jabal-arafat.webp',
  // Madinah images
  '/images/madinah/nabawi-bab-salam.webp',
  '/images/madinah/nabawi-bab-uthman-25.webp',
  '/images/madinah/nabawi-rawdah.webp',
  '/images/madinah/nabawi-umbrellas.webp',
  '/images/madinah/quba-mosque.webp',
  '/images/madinah/mount-uhud.webp',
  '/images/madinah/qiblatayn-mosque.webp',
  '/images/madinah/baqi-cemetery.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Navigation requests: network first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          if (url.pathname.includes('supervisor')) {
            return caches.match('/supervisor.html');
          }
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Never intercept API calls (/api/sync, /api/sos, /api/badge) or Vite dev modules
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/@') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.startsWith('/node_modules/'))
  ) {
    return;
  }

  // Immutable hashed production bundles (/assets/*) and local images (/images/*): cache-first
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/images/'))
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Other same-origin static files (e.g. manifest.json): network-first with cache fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
});
