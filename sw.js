// Gemmer appens egne filer, så den starter hurtigt og kan installeres. Nyeste udgave hentes, når der er net.
// Hæv cache-navnet, når filer ændres.
const CACHE = 'teamkalender-v2.4';
const FILES = ['./', './index.html', './css/style.css', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './js/app.js','./js/config.js','./js/store.js','./js/ui.js','./js/util.js','./js/views/hjaelp.js','./js/views/hold.js','./js/views/holddeling.js','./js/views/kalender.js','./js/views/moeder.js','./js/views/skema.js','./js/views/todo.js','./js/weeks.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
