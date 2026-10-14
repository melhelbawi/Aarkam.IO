/**
 * Aarkam Sovereign Enterprise Storage Platform
 * Service Worker v3.0.0
 * 
 * Author: Mohamed Elhelbawi
 * Team: AarkamIO
 * 
 * Capabilities:
 * - Deterministic cache versioning and clean lifecycle management
 * - Stale-while-revalidate for static assets (CSS, Fonts, Brand SVGs)
 * - Network-first navigation with graceful branded offline fallback (/offline.html)
 * - Strict network-only bypass for secure APIs, cryptographic tokens, and SignalR hubs
 */

const CACHE_VERSION = 'v3.0.2';
const STATIC_CACHE_NAME = `aarkam-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `aarkam-runtime-${CACHE_VERSION}`;

// Core static assets required for shell & offline experience
const PRECACHE_ASSETS = [
    '/offline.html',
    '/manifest.json',
    '/favicon.ico',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/apple-touch-icon.png',
    '/images/aarkam-logo.svg',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable-192.png',
    '/icons/icon-maskable-512.png',
    '/css/bootstrap.min.css',
    '/css/site.css'
];

// Patterns that MUST ALWAYS bypass cache (network-only)
const BYPASS_PATTERNS = [
    /\/api\//i,
    /\/connect\//i,
    /\/identity\//i,
    /\/monitoringHub/i,
    /\/negotiate/i,
    /\/storage\//i,
    /\/logout/i,
    /\/health/i
];

/* ==========================================================================
   INSTALL EVENT
   Precache offline shell and core brand assets
   ========================================================================== */
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then(async (cache) => {
            console.log(`[Aarkam ServiceWorker] Precaching static shell assets (${CACHE_VERSION})...`);
            // Cache items individually so single asset failure does not break installation
            for (const asset of PRECACHE_ASSETS) {
                try {
                    await cache.add(asset);
                } catch (err) {
                    console.warn(`[Aarkam ServiceWorker] Failed to precache asset ${asset}:`, err);
                }
            }
        })
    );
});

/* ==========================================================================
   ACTIVATE EVENT
   Evict obsolete cache versions and claim immediate client control
   ========================================================================== */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME) {
                        console.log(`[Aarkam ServiceWorker] Purging legacy cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

/* ==========================================================================
   FETCH EVENT
   Intelligent request routing based on destination and path
   ========================================================================== */
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // 1. Only handle GET requests; all mutations go to network directly
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    // 2. Ignore unsupported protocols (chrome-extension, etc.)
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // 3. Network-Only for APIs, auth, SignalR hubs, and telemetry
    if (BYPASS_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
        return;
    }

    // 4. HTML Navigation Requests -> Network-First with Offline Fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    return networkResponse;
                })
                .catch(async () => {
                    console.warn(`[Aarkam ServiceWorker] Navigation failed. Serving offline fallback for ${url.pathname}`);
                    const cache = await caches.open(STATIC_CACHE_NAME);
                    const cachedFallback = await cache.match('/offline.html');
                    return cachedFallback || Response.error();
                })
        );
        return;
    }

    // 5. Google Fonts & Static Webfonts -> Cache-First
    if (
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.pathname.includes('/webfonts/') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.woff') ||
        url.pathname.endsWith('.ttf')
    ) {
        event.respondWith(
            caches.open(RUNTIME_CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                const networkResponse = await fetch(request);
                if (networkResponse && networkResponse.status === 200) {
                    cache.put(request, networkResponse.clone());
                }
                return networkResponse;
            })
        );
        return;
    }

    // 6. Brand Images and Icons -> Cache-First with runtime fallback
    if (
        request.destination === 'image' ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.png')
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then(async (networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const cache = await caches.open(RUNTIME_CACHE_NAME);
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Fallback to primary logo if available
                    if (request.destination === 'image') {
                        return caches.match('/images/aarkam-logo.svg');
                    }
                });
            })
        );
        return;
    }

    // 7. CSS and JavaScript -> Stale-While-Revalidate
    if (request.destination === 'style' || request.destination === 'script') {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then(async (networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const cache = await caches.open(RUNTIME_CACHE_NAME);
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch((err) => {
                    // Offline or network error
                    return cachedResponse;
                });

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // Default fallback: Network fetch with cache match fallback
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});

/* ==========================================================================
   MESSAGE EVENT
   Support programmatic updates & cache controls from UI clients
   ========================================================================== */
self.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        );
    }
});
