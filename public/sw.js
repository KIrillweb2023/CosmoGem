const CACHE_NAME = 'my-game-cache-v3';
const STATIC_PATHS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico'
];

// Расширения файлов, которые мы хотим кэшировать
const STATIC_EXTENSIONS = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif',
    '.svg', '.woff', '.woff2', '.ttf', '.json', '.webp'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_PATHS))
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || !isSameOrigin(event.request)) {
        return;
    }

    // Для API - Network First
    if (isApiRequest(event.request)) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    // Для статики - Cache First
    if (isStaticRequest(event.request)) {
        event.respondWith(cacheFirst(event.request));
    }
});

// Стратегии кэширования
async function cacheFirst(request) {
    const cached = await caches.match(request);
    return cached || networkAndCache(request);
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) await cacheResponse(request, response.clone());
        return response;
    } catch {
        return await caches.match(request);
    }
}

async function networkAndCache(request) {
    const response = await fetch(request);
    if (response.ok) await cacheResponse(request, response.clone());
    return response;
}

// Вспомогательные функции
function isSameOrigin(request) {
    return new URL(request.url).origin === self.location.origin;
}

function isApiRequest(request) {
    return new URL(request.url).pathname.startsWith('/api/');
}

function isStaticRequest(request) {
    const url = new URL(request.url);
    return STATIC_EXTENSIONS.some(ext => url.pathname.endsWith(ext)) ||
        STATIC_PATHS.includes(url.pathname);
}

async function cacheResponse(request, response) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
}

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => key !== CACHE_NAME && caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Автоматическое кэширование при навигации
self.addEventListener('message', (event) => {
    if (event.data.type === 'CACHE_NEW_ASSETS') {
        event.waitUntil(cachePageAssets(event.data.url));
    }
});

async function cachePageAssets(url) {
    const response = await fetch(url);
    const html = await response.text();
    const assets = extractAssets(html);

    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(assets.filter(asset =>
        STATIC_EXTENSIONS.some(ext => asset.endsWith(ext))
    ));
}

function extractAssets(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const assets = new Set();

    // Скрипты и стили
    doc.querySelectorAll('script[src], link[rel="stylesheet"]').forEach(el => {
        assets.add(el.src || el.href);
    });

    // Изображения и шрифты
    doc.querySelectorAll('img[src], source[src], source[srcset]').forEach(el => {
        assets.add(el.src || el.srcset.split(' ')[0]);
    });

    return Array.from(assets).filter(Boolean);
}