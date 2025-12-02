const CACHE_NAME = 'dbp-game-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './game-platform.html',
  './js/game-audio-manager-v2.js',
  './js/i18n.js',
  './css/style.css', // 假设有
  './images/map.png',
  './images/hide-and-seek.png',
  './audio/game-bgm.aac',
  // 添加其他关键资源
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching offline page');
        // 尝试缓存所有资源，忽略失败
        return Promise.all(
          ASSETS_TO_CACHE.map(url => {
            return cache.add(url).catch(err => console.warn('Failed to cache:', url, err));
          })
        );
      })
  );
  self.skipWaiting();
});

// 激活
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  // 只处理 http/https 协议的请求
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // 只缓存 GET 请求
  if (event.request.method !== 'GET') return;
  
  // 忽略 API 请求
  if (event.request.url.includes('/api/')) return;
  
  // 忽略外部域名请求（只缓存同源资源）
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 命中缓存，直接返回
        if (response) {
          return response;
        }
        
        // 未命中，发起网络请求
        return fetch(event.request).then(
          (response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 只有图片、音频、JS、CSS、HTML 才缓存
            const urlStr = event.request.url;
            if (urlStr.match(/\.(html|js|css|png|jpg|jpeg|gif|aac|mp3|json)$/i)) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  })
                  .catch(err => console.warn('[SW] Cache put failed:', err));
            }

            return response;
          }
        ).catch(err => {
          console.warn('[SW] Fetch failed:', err);
          return caches.match('./index.html'); // 离线回退
        });
      })
  );
});
