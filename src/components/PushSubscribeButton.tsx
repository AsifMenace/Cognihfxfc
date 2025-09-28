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

export default function PushSubscribeButton() {
  const subscribeUser = async () => {
    if (!("serviceWorker" in navigator)) {
      alert("Service Worker is not supported by your browser.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("Push Notifications permission denied.");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });
    console.log("Push Subscription:", subscription);

    await fetch("/.netlify/functions/save-subscription", {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: { "Content-Type": "application/json" },
    });

    alert("Successfully subscribed to notifications!");
  };

  return (
    <button
      onClick={subscribeUser}
      className="bg-red-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-transform duration-200 ease-in-out"
      aria-label="Subscribe to push notifications"
      type="button"
    >
      🔔 Enable Notifications
    </button>
  );
}
