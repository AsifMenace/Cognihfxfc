import React from "react";
import { Bell } from "lucide-react";

const publicVapidKey =
  "BNBHyUKPyhs3otPFIEZAiJXGSwAe-yGOxtqc8XJqPq7HIFLl-68KSDTzCstktAPdDqgSNJiYutwm4fdu9x-JjEw";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

type PushSubscribeButtonProps = {
  addLog: (message: string) => void;
};

export default function PushSubscribeButton({
  addLog,
}: PushSubscribeButtonProps) {
  const subscribeUser = async () => {
    try {
      addLog("Starting subscription...");

      if (!("serviceWorker" in navigator)) {
        addLog("Service Worker is not supported by your browser.");
        return;
      }

      addLog(`Current notification permission: ${Notification.permission}`);

      if (Notification.permission === "denied") {
        addLog(
          "Notification permission has been denied previously. Please enable it manually in settings."
        );
        return;
      }

      if (Notification.permission !== "granted") {
        addLog("Requesting notification permission...");
        const permission = await Notification.requestPermission();
        addLog(`Notification permission result: ${permission}`);
        if (permission !== "granted") {
          addLog("Push Notifications permission denied.");
          return;
        }
      }

      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        addLog("Service Worker registration not ready.");
        return;
      }
      addLog("Service worker ready.");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      addLog("Push subscription created.");
      addLog(JSON.stringify(subscription));

      const response = await fetch("/.netlify/functions/save-subscription", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to save subscription: ${response.status} - ${errorText}`
        );
      }

      addLog("Subscription saved successfully!"); // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      addLog(`Subscription error: ${error.message}`);
    }
  };
}
