/* ══════════════════════════════════════════════════════════
   sw.js — Service Worker for Download App X Beam PWA
   Strategy: Network-first (auto-update) + Cache-fallback (offline)
   ══════════════════════════════════════════════════════════ */
'use strict';

const CACHE_VER  = 'daxb-auto-v1';
const CORE = [
  './',
  './index.html',
  './style.css',
  './store.js',
  './catalog.json',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
];

// ─── Install: cache core assets แล้ว skipWaiting ทันที ───
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VER)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: ลบ cache เก่า + claim ทันที ───
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VER).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // แจ้งทุก client ว่ามีอัพเดท
        self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }));
        });
      })
  );
});

// ─── Fetch: Network-first → Cache-fallback (offline support) ───
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // API requests → network only (no cache)
  if (url.pathname.startsWith('/api/')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_VER).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          if (e.request.mode === 'navigate') return caches.match('./index.html');
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

// ─── Message handler ───
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
