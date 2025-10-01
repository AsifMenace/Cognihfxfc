// =========================
// Service Worker (Enhanced)
// =========================

// 🔄 Update this when you deploy a new version
const SW_VERSION = "v1.0.1";
const CACHE_NAME = `my-app-cache-${SW_VERSION}`;

// ✅ Core assets to pre-cache (update paths for your app)
const APP_SHELL = [
  "/", // root
  "/index.html", // main HTML
  "/manifest.json", // manifest
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// --------------------
// Install Event
// --------------------
self.addEventListener("install", (event) => {
  console.log(`[SW] Installing v${SW_VERSION}...`);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );

  // 🚀 Activate immediately
  self.skipWaiting();
});

// --------------------
// Activate Event
// --------------------
self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating v${SW_VERSION}...`);

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME) // remove old versions
          .map((key) => caches.delete(key))
      )
    )
  );

  // 🚀 Take control of all clients right away
  self.clients.claim();
});

// --------------------
// Fetch Event
// --------------------
self.addEventListener("fetch", (event) => {
  const requestURL = new URL(event.request.url);

  // Skip caching for non-http(s) requests like chrome-extension://
  if (requestURL.protocol !== "http:" && requestURL.protocol !== "https:") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Serve from cache if available
      }
      return fetch(event.request)
        .then((networkResponse) => {
          // Optionally cache new responses
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Offline fallback (if index.html available)
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});

// --------------------
// Push Notifications
// --------------------
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
    data: data.url || "/", // 👉 allows click to open URL
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// --------------------
// Notification Click
// --------------------
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
