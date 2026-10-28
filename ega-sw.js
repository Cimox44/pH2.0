/* Service worker — cache offline (aggiornare CACHE a ogni rilascio: deve coincidere con VERSION in ega-engine.js) */
const CACHE = 'ega-v1.2.0';
const ASSETS = ['./', 'index.html', 'ega-styles.css', 'ega-engine.js', 'ega-content.js', 'ega-app.js', 'ega-manifest.json',
  'ega-icon-192.png', 'ega-icon-512.png', 'ega-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))); self.skipWaiting(); });
// cache: 'reload' = scarica dalla rete ignorando la cache HTTP del browser (GitHub Pages max-age=600)
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // network-first per l'HTML (aggiornamenti rapidi), cache-first per il resto.
  // index.html richiama i file con ?v=VERSION: una pagina nuova non usa mai JS/CSS della versione precedente.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); } return r; })
      .catch(() => caches.open(CACHE).then(c => c.match('index.html'))));
    return;
  }
  // solo la cache della versione corrente; ignoreSearch: i file sono richiesti come "ega-app.js?v=x.y.z"
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: true })).then(m => m || fetch(e.request).then(r => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  })));
});
