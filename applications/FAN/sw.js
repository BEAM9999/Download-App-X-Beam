/* ══════════════════════════════════════════════════════════
   FAN Service Worker — Auto-Update + Offline Support
   Strategy: Network-first (online → cache), Cache-fallback (offline)
   ══════════════════════════════════════════════════════════ */
'use strict';

const CACHE_NAME = 'fan-auto-v1';

// ไฟล์หลักที่ต้อง cache สำหรับ offline
const CORE_ASSETS = [
  './', './index.html', './app.js', './style.css',
  './theme-customizer.css', './theme-customizer.js',
  './chat.html', './chat.css', './chat.js',
  './AI/api-key/key.js', './AI/api-key/gemini-key.js',
  './manifest.json',
  './icons/favicon.ico', './icons/favicon-192.png', './icons/favicon-512.png',
  './icons/favicon-touch.png'
];

// ─── Install: cache core assets แล้ว skipWaiting ทันที ───
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: ลบ cache เก่า แล้ว claim clients ทันที ───
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
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

// ─── Fetch: Network-first → Cache-fallback (ใช้ออฟไลน์ได้ 100%) ───
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // ได้จาก network → cache ไว้สำหรับ offline
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // ออฟไลน์ → ใช้ cache
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // ถ้าเป็น navigation request → fallback index.html
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
