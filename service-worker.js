const CACHE_NAME = "finance-cache-v1";
const URLS_TO_CACHE = [
  "/", 
  "/index.html",
  "/favicon.png",
  "/manifest.json"
];

// Install → simpan ke cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  console.log("✅ Service Worker: Cached files");
});

// Activate → hapus cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  console.log("✅ Service Worker: Active");
});

// Fetch → ambil dari cache dulu
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
