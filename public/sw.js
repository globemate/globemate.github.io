// GlobeMate Service Worker — minimal, sin caché agresivo
// Solo existe para satisfacer el requisito de instalabilidad PWA.
// Estrategia: network-only para recursos del propio origen.
// Las peticiones cross-origin (Firebase Auth, Firestore, Google APIs) se dejan
// pasar sin interceptar para evitar que el SW cause auth/network-request-failed.

const CACHE_NAME = 'globemate-noop-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Solo interceptar recursos del propio origen; dejar que el navegador
  // gestione directamente las APIs externas (Firebase, Google, Stripe, etc.)
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(fetch(e.request));
});
