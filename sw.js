const CACHE = "refocus-todo-v1";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./Brigends-Expanded.otf", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: open instantly from cache, refresh in the background.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const ok = url.origin === location.origin || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!ok) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then((res) => {
        if (res && (res.status === 200 || res.type === "opaque")) cache.put(req, res.clone());
        return res;
      }).catch(() => cached || (req.mode === "navigate" ? cache.match("./index.html") : undefined));
      return cached || net;
    })
  );
});
