const SW_VERSION = "v1.1.1";
const CACHE_NAME = `my-app-cache-${SW_VERSION}`;

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  console.log(`[SW] Installing v${SW_VERSION}...`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting(); // Immediately activate new SW
});

self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating v${SW_VERSION}...`);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim(); // Take control immediately
});

// Respond with cache, then network and cache new
self.addEventListener("fetch", (event) => {
  const requestURL = new URL(event.request.url);

  if (requestURL.pathname.startsWith("/.netlify/functions/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Only handle same-origin GET requests. Everything else — POSTs, and
  // cross-origin resources like flag CDN images (which come back "opaque" and
  // can't be inspected for success) — passes straight to the network and is
  // never cached, so a failed one can't get stuck in the cache.
  if (
    event.request.method !== "GET" ||
    requestURL.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request)
        .then((networkResponse) => {
          // Only cache successful responses. A 4xx/5xx during a blip must not be
          // saved — cache-first would then serve that error until the next deploy.
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});

// Push Notification logic unchanged
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "New Notification", body: "You have a new alert." };
  }
  const title = data.title || "Notification";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: data.url || "/",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === event.notification.data && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data);
        }
      })
  );
});

// ** Add this message listener for in-app update prompt support **
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
