import React, { useState } from "react";
import PushSubscribeButton from "./PushSubscribeButton";

export default function PushNotificationPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg].slice(-10)); // keep last 10 logs
  };

  return (
    <div>
      <PushSubscribeButton addLog={addLog} />
      <div
        style={{
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          background: "#eee",
          padding: 12,
          maxHeight: 150,
          overflowY: "auto",
          borderRadius: 6,
          marginTop: 16,
          border: "1px solid #ccc",
        }}
        aria-live="polite"
      >
        {logs.length > 0 ? logs.join("\n") : "Logs will appear here."}
      </div>
    </div>
  );
}
