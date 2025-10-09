import { useEffect, useState } from "react";
import { registerServiceWorker, refreshApp } from "../utils/swManager";

export const useServiceWorkerUpdate = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let currentRegistration: ServiceWorkerRegistration | null = null;

    // Register SW and handle updates
    registerServiceWorker((worker) => {
      setWaitingWorker(worker);
      setUpdateAvailable(true);
    }).then((reg) => {
      currentRegistration = reg || null;
    });

    // ✅ iOS optimization: manually check for updates when app resumes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && currentRegistration) {
        currentRegistration.update();
        console.log("🔄 Checked for SW update (iOS resume)");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleRefresh = () => {
    refreshApp(waitingWorker);
    setUpdateAvailable(false);
  };

  return { updateAvailable, handleRefresh };
};
