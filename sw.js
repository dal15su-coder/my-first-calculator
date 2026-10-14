// 계산기 파일만 저장합니다. 같은 도메인의 다른 앱 캐시는 건드리지 않습니다.
const CACHE = 'my-first-calculator-v1';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './icons/calculator-192.png', './icons/calculator-512.png'
];
const paths = FILES.map((file) => new URL(file, self.registration.scope).pathname);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(
    names.filter((name) => name.startsWith('my-first-calculator-') && name !== CACHE)
      .map((name) => caches.delete(name))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin
      || !paths.includes(url.pathname)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(event.request, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Page unavailable');
        await cache.put('./index.html', response.clone());
        return response;
      } catch {
        return await cache.match('./index.html') || new Response(
          '처음에는 인터넷에 연결해 계산기를 열어 주세요.',
          { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        );
      }
    })());
  } else {
    event.respondWith(caches.match(event.request).then((saved) => saved || fetch(event.request)));
  }
});
