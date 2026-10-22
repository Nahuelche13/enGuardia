/* Offline support: answer from the cache right away and refresh it in the
   background, so a new deploy shows up on the following visit. */
const CACHE = 'enGuardia-v1';
const SHELL = [
  './', 'index.html', 'month.html', 'year.html', 'manifest.json',
  'css/vars.css', 'css/base.css', 'css/month.css', 'css/year.css',
  'js/guardia.js', 'js/month.js', 'js/year.js',
  'icons/favicon.svg', 'icons/favicon.png', 'icons/favicon-192.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then(res => {
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    });
    if (cached) {
      e.waitUntil(fresh.catch(() => { }));
      return cached;
    }
    return fresh;
  }));
});
