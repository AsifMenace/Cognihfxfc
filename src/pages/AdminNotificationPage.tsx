import React, { useState } from "react";
import { getAdminHeaders } from "../utils/auth";

export default function AdminNotificationPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      alert("Please fill both title and message.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/.netlify/functions/send-notifications", {
        method: "POST",
        headers: getAdminHeaders(),
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

  const inputCls = "w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none";
  const labelCls = "block mb-1 text-sm font-bold text-gray-300";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <h1 className="text-3xl font-black text-yellow-400 text-center mb-8">SEND NOTIFICATION</h1>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 md:p-8 space-y-5 shadow-2xl">
          <div>
            <label className={labelCls}>Title</label>
            <input
              type="text"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Message</label>
            <textarea
              placeholder="Notification body..."
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={status === "sending"}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black rounded-lg hover:scale-105 transition-all disabled:opacity-50"
          >
            {status === "sending" ? "SENDING..." : "SEND NOTIFICATION"}
          </button>

          {status === "success" && (
            <p className="text-green-400 text-sm text-center">Notification sent successfully!</p>
          )}
          {status === "error" && (
            <p className="text-red-400 text-sm text-center">Error sending notification. Try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}
