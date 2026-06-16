// GlobeMate Service Worker — minimal, sin caché agresivo
// Solo existe para satisfacer el requisito de instalabilidad PWA.
// Estrategia: siempre red (network-only). Sin caché → sin contenido viejo.

const CACHE_NAME = 'globemate-noop-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Borra cualquier caché de versiones anteriores al activar
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-only: nunca sirve desde caché
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request));
});
