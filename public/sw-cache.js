const CACHE_NAME = 'vacatio-img-v1';

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
  // Only cache Supabase Storage image requests
  if (
    !url.includes('supabase.co/storage') &&
    !url.includes('supabase.co/object')
  ) return;

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
