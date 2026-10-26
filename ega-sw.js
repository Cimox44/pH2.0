/* Service worker — cache offline (aggiornare CACHE a ogni rilascio) */
const CACHE = 'ega-v1.1.0';
const ASSETS = ['./', 'index.html', 'ega-styles.css', 'ega-engine.js', 'ega-content.js', 'ega-app.js', 'ega-manifest.json',
  'ega-icon-192.png', 'ega-icon-512.png', 'ega-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // network-first per l'HTML (aggiornamenti rapidi), cache-first per il resto
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(m => m || fetch(e.request).then(r => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  })));
});
