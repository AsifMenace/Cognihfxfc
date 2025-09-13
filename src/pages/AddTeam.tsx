import React, { useState } from "react";

export function AddTeam() {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#000000"); // default black
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("Team name is required.");
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/addTeam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          color: color || "#000000",
          description: description.trim(),
        }),
      });

      if (res.ok) {
        setMessage("Team added successfully!");
        setName("");
        setColor("#000000");
        setDescription("");
      } else {
        const err = await res.json();
        setMessage(err.error || "Failed to add team.");
      }
    } catch {
      setMessage("An unknown error occurred.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto p-4 bg-white rounded shadow"
    >
      <h2 className="text-lg font-bold mb-4">Add New Team</h2>

      <input
        type="text"
        placeholder="Team Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 mb-3 border rounded"
        required
      />

      <label className="block mb-1 font-semibold">Team Color (hex code)</label>
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-full mb-3 p-1 border rounded"
      />

      <textarea
        placeholder="Team Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 mb-3 border rounded"
        rows={3}
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Team
      </button>

      {message && <p className="mt-3 text-center">{message}</p>}
    </form>
  );
}
