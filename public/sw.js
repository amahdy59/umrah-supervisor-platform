const CACHE_NAME = 'umrah-companion-v5';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/supervisor.html',
  '/manifest.json',
  '/images/makkah/kaaba-door.jpg',
  '/images/makkah/gate-abdulaziz.jpg',
  '/images/makkah/gate-fahd.jpg',
  '/images/makkah/king-abdullah-gate.jpg',
  '/images/makkah/bab-al-umrah.jpg',
  '/images/makkah/safa-marwah-masa.jpg',
  '/images/makkah/zamzam-stations.jpg',
  '/images/madinah/nabawi-bab-salam.jpg',
  '/images/madinah/nabawi-bab-uthman-25.jpg',
  '/images/madinah/nabawi-rawdah.jpg',
  '/images/madinah/quba-mosque.jpg',
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

  // Skip Vite dev / HMR module endpoints
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/@') ||
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

  // Fonts & external static assets: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkPromise;
      })
    );
  }
});
