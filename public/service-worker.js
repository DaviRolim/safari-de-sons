const CACHE_VERSION = "v1";
const CACHE_NAME = `safari-de-sons-${CACHE_VERSION}`;

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./splash-1170x2532.png",
  "./assets/images/jungle-bg.png",
  "./assets/images/lion.png",
  "./assets/images/zebra.png",
  "./assets/images/hippo.png",
  "./assets/images/giraffe.png",
  "./assets/images/lemur.png",
  "./assets/voice/lion.mp3",
  "./assets/voice/zebra.mp3",
  "./assets/voice/hippo.mp3",
  "./assets/voice/giraffe.mp3",
  "./assets/voice/lemur.mp3",
  "./assets/sounds/lion-roar.mp3",
  "./assets/sounds/zebra-neigh.mp3",
  "./assets/sounds/hippo-grunt.mp3",
  "./assets/sounds/giraffe-bleat.mp3",
  "./assets/sounds/lemur-chatter.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("safari-de-sons-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
