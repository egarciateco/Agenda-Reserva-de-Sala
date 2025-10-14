const CACHE_NAME = 'telecom-reserva-cache-v23'; // Incremented version
const urlsToCache = [
  '/',
  '/index.html',
  '/bundle.js',
  'https://i.postimg.cc/bvr9syk6/Personal-logonuevo-1.png',
  'https://i.postimg.cc/3NMv9VMS/oficina-moderna-paredes-verdes-pisos-madera-asientos-comodos-191095-99743.avif',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto-format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://i.postimg.cc/Hss2rxB2/IMAGEN-SITE.png'
];

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Use a "Network falling back to cache" strategy for navigation requests (the HTML)
  // and the main script bundle. This ensures the app is always up-to-date when online.
  const isAppShell = event.request.mode === 'navigate' || 
                     event.request.url.endsWith('/bundle.js') || 
                     event.request.url.endsWith('/index.html') ||
                     event.request.url.endsWith('/');

  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If we get a valid response, clone it, cache it, and return it.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If the network fails, serve the cached version.
          return caches.match(event.request).then(response => {
            return response || caches.match('/index.html'); // Fallback to index
          });
        })
    );
    return;
  }

  // For all other requests (images, etc.), use a "Cache first, falling back to network" strategy.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(networkResponse => {
            // Optionally cache new assets as they are requested.
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
            });
            return networkResponse;
        });
      })
  );
});