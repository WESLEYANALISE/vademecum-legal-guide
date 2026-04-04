const CACHE_NAME = 'vacatio-img-v3';
const IMG_EXT = /\.(jpe?g|png|webp|svg|gif|avif|ico)(\?|$)/i;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;

  const isImage =
    IMG_EXT.test(url) ||
    url.includes('supabase.co/storage') ||
    url.includes('supabase.co/object') ||
    url.includes('wsrv.nl/');

  if (!isImage) return;

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        });
      })
    )
  );
});
