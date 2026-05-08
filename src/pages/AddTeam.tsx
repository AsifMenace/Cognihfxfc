import React, { useState } from "react";
import { getAdminHeaders } from "../utils/auth";

export function AddTeam() {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#000000");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage({ text: "Team name is required.", ok: false });
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/addTeam", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          color: color || "#000000",
          description: description.trim(),
        }),
      });

      if (res.ok) {
        setMessage({ text: "Team added successfully!", ok: true });
        setName("");
        setColor("#000000");
        setDescription("");
      } else {
        const err = await res.json();
        setMessage({ text: err.error || "Failed to add team.", ok: false });
      }
    } catch {
      setMessage({ text: "An unknown error occurred.", ok: false });
    }
  }

  const inputCls = "w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none";
  const labelCls = "block mb-1 text-sm font-bold text-gray-300";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <h1 className="text-3xl font-black text-yellow-400 text-center mb-8">ADD TEAM</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 md:p-8 space-y-5 shadow-2xl"
        >
          {message && (
            <p className={`text-sm font-medium ${message.ok ? "text-green-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}

          <div>
            <label className={labelCls}>Team Name</label>
            <input
              type="text"
              placeholder="e.g. Red, Blue, Cogni HFX FC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Team Color</label>
            <div className="flex items-center gap-4 p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-full cursor-pointer border-2 border-slate-500 shadow-md hover:scale-105 transition-transform"
              />
              <div>
                <p className="text-xs text-gray-400">Selected color</p>
                <p className="font-mono text-base font-bold text-white">{color.toUpperCase()}</p>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Description (optional)</label>
            <textarea
              placeholder="Short description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} resize-none`}
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black rounded-lg hover:scale-105 transition-all"
          >
            ADD TEAM
          </button>
        </form>
      </div>
    </div>
  );
}
