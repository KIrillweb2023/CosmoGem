const CACHE_NAME = 'my-game-cache-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/assets/*.js',
    '/assets/*.css',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/favicon.ico',
    '/favicon-32x32.png',
    '/assets/stages.svg',
    '/assets/key.png',
    '/assets/logoGame/logo-game.jpeg',
    '/assets/bg-game/bg-game.jpg',
    '/assets/AccauntImage/baggi.jpeg',
    '/assets/AccauntImage/enduro.jpeg',
    '/assets/AccauntImage/quadrocikle.jpeg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});