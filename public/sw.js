const CACHE_NAME = 'sg-air-shell-v9';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/sg-air-icon-192.png',
  '/icons/sg-air-icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/air-logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.hostname === 'api.data.gov.sg' || url.hostname === 'ios-install-api.benson.in.net') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    try {
      const response = await fetch(request);
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    } catch {
      if (cached) return cached;
      if (request.mode === 'navigate') return (await cache.match('/')) || Response.error();
      return Response.error();
    }
  })());
});
