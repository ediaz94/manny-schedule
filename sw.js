/* Service worker â€” cache the app shell so it works offline.
   Bump CACHE when you change files to force an update. */
const CACHE = "manny-plan-v21";
const ASSETS = [
  "./", "./index.html", "./styles.css", "./manifest.webmanifest",
  "./js/foods.js", "./js/data.js", "./js/store.js", "./js/ui.js",
  "./js/screens-core.js", "./js/screens-plan.js", "./js/app.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-180.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
