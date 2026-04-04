const CACHE_NAME = 'vacatio-img-v2';

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
  // Cache Supabase Storage images AND wsrv.nl proxied images
  const isSupabaseStorage = url.includes('supabase.co/storage') || url.includes('supabase.co/object');
  const isProxy = url.includes('wsrv.nl/');
  if (!isSupabaseStorage && !isProxy) return;

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
