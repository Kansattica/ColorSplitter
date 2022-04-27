// from https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers

const cacheName = "colorsplit-v1";
const filesToCache = ["/colorsplit/", "/colorsplit/colorsplit.js", "/colorsplit/tips.html", "/gallery.css", "/colorsplit/colorsplit.css", "/colorsplit/favicon.ico", "/colorsplit/favicon-32x32.png", "/colorsplit/android-chrome-192x192.png", "/colorsplit/android-chrome-512x512" ];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(filesToCache);
  })());
});

self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    if (r) return r;
    const response = await fetch(e.request);
    const cache = await caches.open(cacheName);
    cache.put(e.request, response.clone());
    return response;
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
          return Promise.all(keyList.map((key) => {
        if(key !== cacheName) {
          return caches.delete(key);
        }
      }));
    })
  );
});
