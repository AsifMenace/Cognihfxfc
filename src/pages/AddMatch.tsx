import { useState } from "react";

interface AddMatchProps {
  onMatchAdded?: () => void;
}
export function AddMatch({ onMatchAdded }: AddMatchProps) {
  const [form, setForm] = useState({
    date: "",
    time: "",
    opponent: "",
    venue: "",
    result: "",
    competition: "",
    ishome: true, // if used; adjust as needed
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    let newValue: string | boolean = value;

    if (type === "checkbox" && "checked" in e.target) {
      newValue = (e.target as HTMLInputElement).checked;
    }

    setForm((f) => ({
      ...f,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Time value to submit:", form.time);
    console.log("Submitting match:", form);
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/.netlify/functions/addMatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Match added!");
        setForm({
          date: "",
          time: "",
          opponent: "",
          venue: "",
          result: "",
          competition: "",
          ishome: true,
        });
        if (onMatchAdded) onMatchAdded(); // trigger refresh in Games
      } else {
        setError(data.error || "Error adding match.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError("Error: " + err.message);
      } else {
        setError("An unknown error occurred");
      }
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 bg-white rounded shadow my-8"
    >
      <h2 className="text-xl font-bold mb-4">Add Match</h2>
      <input
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded mb-3"
      />
      <input
        type="time"
        name="time"
        value={form.time}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded mb-3"
      />
      <input
        type="text"
        name="opponent"
        value={form.opponent}
        onChange={handleChange}
        required
        placeholder="Opponent"
        className="w-full p-2 border rounded mb-3"
      />
      <input
        type="text"
        name="venue"
        value={form.venue}
        onChange={handleChange}
        required
        placeholder="Venue"
        className="w-full p-2 border rounded mb-3"
      />
      <input
        type="text"
        name="result"
        value={form.result}
        onChange={handleChange}
        placeholder="Result (e.g., 2-1)"
        className="w-full p-2 border rounded mb-3"
      />
      <input
        type="text"
        name="competition"
        value={form.competition}
        onChange={handleChange}
        placeholder="Competition"
        className="w-full p-2 border rounded mb-3"
      />
      {/* If you use ishome field: */}
      <label className="flex items-center mb-3">
        <input
          type="checkbox"
          name="ishome"
          checked={form.ishome}
          onChange={handleChange}
          className="mr-2"
        />
        Home match
      </label>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? "Adding..." : "Add Match"}
      </button>
    </form>
  );
}
