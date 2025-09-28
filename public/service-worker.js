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
