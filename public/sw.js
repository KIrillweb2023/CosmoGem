const CACHE_NAME = 'my-game-cache-v2'; // Изменил версию для обновления кэша
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/*.js',
    '/assets/*.css',
    '/AppIcons/icon-192x192.png',
    '/AppIcons/icon-512x512.png',
    '/AppIcons/favicon.ico',
    '/AppIcons/favicon-32x32.png',
    '/assets/stages.svg',
    '/assets/images/logo-game.jpeg',
    '/assets/bg-game/bg-game.jpg',
    '/assets/AccauntImage/baggi.jpeg',
    '/assets/AccauntImage/enduro.jpeg',
    '/assets/AccauntImage/quadrocikle.jpeg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS).catch(err => {
                    console.error('Failed to cache some assets:', err);
                });
            })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseToCache));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseToCache));

                    return response;
                });
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Удаляем старые версии кэша
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});