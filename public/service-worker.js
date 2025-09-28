self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
  // Cache resources here if needed
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated.");
});

self.addEventListener("fetch", (event) => {
  // You can add caching logic here, or skip for now
});

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
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
