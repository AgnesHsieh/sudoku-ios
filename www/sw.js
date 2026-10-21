/**
 * Sudoku Service Worker - 完整離線快取支援 (Cache-First)
 * 支援無網路 (飛航模式) 與完全脫離電腦獨立運行
 */

const CACHE_NAME = 'sudoku-ios-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/ios-theme.css',
  './css/sudoku.css',
  './js/sudoku-engine.js',
  './js/audio.js',
  './js/game.js',
  './js/app.js',
  './icons/app-icon.jpg'
];

// 安裝時預先快取所有核心資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 正在預快取遊戲核心資源...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 啟動時清除舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] 清理舊快取:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache-First 策略：優先從快取讀取，確保無網路完全可用
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      // 離線回退
      return caches.match('./index.html');
    })
  );
});
