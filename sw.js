/* Service worker: caches the app shell so the PWA opens instantly and offline.
   Bump CACHE when you ship a new index.html so installed copies refresh. */
const CACHE = "l3-investigator-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-48.png", "./icons/icon-96.png", "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/maskable-192.png", "./icons/maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* Same-origin GETs only: cached copy first, refreshed from the network in the background.
   Gemini and every other cross-origin request go straight to the network, untouched. */
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => { if (res && res.ok) cache.put(r, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    if (res) return res;
    if (r.mode === "navigate") return (await cache.match("./index.html")) || Response.error();
    return Response.error();
  }));
});
