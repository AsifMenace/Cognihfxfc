import React, { useState } from "react";

export default function AdminNotificationPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      alert("Please fill both title and message.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/.netlify/functions/send-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (res.ok) {
        setStatus("success");
        setTitle("");
        setBody("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">Send Notification</h2>
      <div className="mb-3">
        <label className="block mb-1 font-medium">Title</label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Message</label>
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <button
        className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
        onClick={handleSend}
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending..." : "Send Notification"}
      </button>
      {status === "success" && (
        <p className="mt-3 text-green-600">Notification sent successfully!</p>
      )}
      {status === "error" && (
        <p className="mt-3 text-red-600">
          Error sending notification, try again.
        </p>
      )}
    </div>
  );
}
