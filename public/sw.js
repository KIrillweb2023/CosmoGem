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
    '/assets/key.png',
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
    // Пропускаем запросы, которые не являются GET или относятся к другому источнику
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Для API запросов используем сеть с fallback к кэшу
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Клонируем ответ для кэширования
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseToCache));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Для статических ресурсов используем стратегию Cache First
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Возвращаем кэшированный ответ, если он есть
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Иначе загружаем из сети и кэшируем
                return fetch(event.request).then(response => {
                    // Проверяем валидность ответа
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Клонируем ответ для кэширования
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