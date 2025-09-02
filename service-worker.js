self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("finance-cache-v1").then((cache) => {
      return cache.addAll([
        "./index.html",
        "./manifest.json",
        "./favicon.jpg"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request);
    })
  );
});
