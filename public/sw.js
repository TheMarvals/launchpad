const CACHE_PREFIX = 'launchpad-pwa';
const STATIC_CACHE = `${CACHE_PREFIX}-static-v1`;
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== STATIC_CACHE)
        .map((cacheName) => caches.delete(cacheName)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Administrative pages remain network-only so sessions and private data are
  // never persisted in the service worker cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  const isVersionedStaticAsset = url.pathname.startsWith('/_next/static/');
  const isPrecachedPublicAsset = PRECACHE_URLS.includes(url.pathname);

  if (!isVersionedStaticAsset && !isPrecachedPublicAsset) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((response) => {
        if (!response.ok || response.type !== 'basic') return response;

        const responseToCache = response.clone();
        void caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseToCache));
        return response;
      });
    }),
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'LAUNCHPAD', {
      body: payload.body || '',
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      tag: payload.tag,
      data: {
        url: payload.url || '/',
      },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let destination = new URL(event.notification.data?.url || '/', self.location.origin);
  if (destination.origin !== self.location.origin) {
    destination = new URL('/', self.location.origin);
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      const existingClient = clientList.find((client) => new URL(client.url).origin === self.location.origin);

      if (existingClient) {
        await existingClient.navigate(destination.href);
        return existingClient.focus();
      }

      return self.clients.openWindow(destination.href);
    }),
  );
});
