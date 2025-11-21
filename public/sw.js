// const CACHE_NAME = "outdoor-workout-spots-v1";
// const urlsToCache = [
//   "/",
//   "/manifest.json",
// ];
//
// // Install event - cache essential files
// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       return cache.addAll(urlsToCache);
//     })
//   );
//   self.skipWaiting();
// });
//
// // Activate event - clean up old caches
// self.addEventListener("activate", (event) => {
//   event.waitUntil(
//     caches.keys().then((cacheNames) => {
//       return Promise.all(
//         cacheNames.map((cacheName) => {
//           if (cacheName !== CACHE_NAME) {
//             return caches.delete(cacheName);
//           }
//         })
//       );
//     })
//   );
//   self.clients.claim();
// });
//
// // Fetch event - serve from cache, fallback to network
// self.addEventListener("fetch", (event) => {
//   // Skip non-GET requests
//   if (event.request.method !== "GET") {
//     return;
//   }
//
//   // Skip chrome extensions and other non-http requests
//   if (!event.request.url.startsWith("http")) {
//     return;
//   }
//
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       // Return cached version or fetch from network
//       return (
//         response ||
//         fetch(event.request).then((fetchResponse) => {
//           // Cache successful responses
//           if (fetchResponse && fetchResponse.status === 200) {
//             const responseToCache = fetchResponse.clone();
//             caches.open(CACHE_NAME).then((cache) => {
//               cache.put(event.request, responseToCache);
//             });
//           }
//           return fetchResponse;
//         })
//       );
//     }).catch(() => {
//       // Return offline page if available
//       return caches.match("/");
//     })
//   );
// });
