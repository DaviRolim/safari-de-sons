// IMPORTANT: bump CACHE_VERSION on every deploy that changes any precached or
// dynamically-fetched asset. The hashed Vite bundles (`assets/main-XXXX.js`,
// `assets/main-XXXX.css`) are cached on first fetch by the handler below; the
// precache list only covers stable filenames.
const CACHE_VERSION = "v4";
const CACHE_NAME = `safari-de-sons-${CACHE_VERSION}`;

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./splash-1170x2532.png",
  // Backgrounds
  "./assets/images/jungle-bg.png",
  "./assets/images/backyard-bg.png",
  // Jungle sprites (v1)
  "./assets/images/lion.png",
  "./assets/images/zebra.png",
  "./assets/images/hippo.png",
  "./assets/images/giraffe.png",
  "./assets/images/lemur.png",
  "./assets/images/natan-jungle.png",
  // Backyard sprites (v1.5)
  "./assets/images/cow.png",
  "./assets/images/dog.png",
  "./assets/images/cat.png",
  "./assets/images/turtle.png",
  "./assets/images/bird.png",
  "./assets/images/natan-backyard.png",
  // Voices
  "./assets/voice/lion.mp3",
  "./assets/voice/zebra.mp3",
  "./assets/voice/hippo.mp3",
  "./assets/voice/giraffe.mp3",
  "./assets/voice/lemur.mp3",
  "./assets/voice/cow.mp3",
  "./assets/voice/dog.mp3",
  "./assets/voice/cat.mp3",
  "./assets/voice/turtle.mp3",
  "./assets/voice/bird.mp3",
  "./assets/voice/natan.mp3",
  // Sounds
  "./assets/sounds/lion-roar.mp3",
  "./assets/sounds/zebra-neigh.mp3",
  "./assets/sounds/hippo-grunt.mp3",
  "./assets/sounds/giraffe-bleat.mp3",
  "./assets/sounds/lemur-chatter.mp3",
  "./assets/sounds/cow-moo.mp3",
  "./assets/sounds/dog-bark.mp3"
  // cat-meow, turtle-splash, bird-tweet, and natan-giggle are not yet curated;
  // taps on those animals fall through to silent per the v1 audio contract.
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
  // Only cache same-origin GETs (avoid third-party CDN noise).
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Only cache valid (200) opaque-or-basic responses.
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
