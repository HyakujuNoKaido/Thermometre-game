// Service Worker — cache minimal pour PWA (offline shell)
const CACHE = "thermo-v1";
const ASSETS = ["./", "./index.html", "./icon.svg", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const url = e.request.url;
  // Ne jamais mettre Firebase/Worker en cache (temps réel)
  if (url.includes("firebaseio") || url.includes("firebasedatabase") || url.includes("/api/")) return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
});
