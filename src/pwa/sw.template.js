/* Service worker de Jàng Wolof : généré au build par vite.config.ts (ne pas éditer dist/sw.js).
 *
 * - Précache : la page, le code et les icônes de cette version, pour un démarrage hors ligne.
 * - Navigation : réseau d'abord (nouvelle version dès qu'elle est en ligne), sinon page en cache.
 * - Audio (/audio/…) : mis en cache à la première écoute, uniquement si c'est vraiment un
 *   fichier audio ; les requêtes HEAD de détection répondent depuis le cache hors ligne.
 * - Polices Google : cache, actualisé en arrière-plan.
 * Rien d'autre que des GET/HEAD de même origine (et les polices) n'est intercepté.
 */
const BUILD_ID = '__BUILD_ID__';
const PRECACHE = `jang-wolof-app-${BUILD_ID}`;
const AUDIO_CACHE = 'jang-wolof-audio-v1';
const FONT_CACHE = 'jang-wolof-fonts-v1';
const PRECACHE_URLS = __PRECACHE__;
const KEEP = [PRECACHE, AUDIO_CACHE, FONT_CACHE];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('jang-wolof-') && !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isAudio = (response) => response.ok && (response.headers.get('content-type') || '').startsWith('audio/');

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PRECACHE);
      cache.put('/', response.clone());
    }
    return response;
  } catch {
    return (await caches.match('/')) || Response.error();
  }
}

async function cacheFirst(request, cacheName, accept) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (accept(response)) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function audioHead(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(new Request(request.url));
    return cached ? new Response(null, { status: 200, headers: cached.headers }) : Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    if (request.method === 'GET') event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/audio/')) {
    if (request.method === 'HEAD') event.respondWith(audioHead(request));
    else if (request.method === 'GET' && !request.headers.has('range')) event.respondWith(cacheFirst(request, AUDIO_CACHE, isAudio));
    return;
  }
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }
  event.respondWith(cacheFirst(request, PRECACHE, (r) => r.ok));
});
