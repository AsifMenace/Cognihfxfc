// src/utils/swManager.ts
export type SWUpdateHandler = (waitingWorker: ServiceWorker) => void;

export const registerServiceWorker = async (onUpdate: SWUpdateHandler) => {
  if (
    !("serviceWorker" in navigator) ||
    process.env.NODE_ENV !== "production"
  ) {
    console.warn("⚠️ Service workers not supported or disabled in dev mode");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      {
        scope: "/",
      }
    );

    console.log("✅ Service Worker registered:", registration);

    registration.onupdatefound = () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.onstatechange = () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("⚡ New service worker available");
            onUpdate(newWorker);
          }
        };
      }
    };

    // periodic check every 10 minutes
    setInterval(() => registration.update(), 10 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error("❌ Service Worker registration failed:", error);
    return null;
  }
};

export const refreshApp = (waitingWorker: ServiceWorker | null) => {
  if (waitingWorker) {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }
  window.location.reload();
};
