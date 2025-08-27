import { useState, useEffect } from "react";

interface Team {
  id: number;
  name: string;
}

interface AddMatchProps {
  onMatchAdded?: () => void;
}

export function AddMatch({ onMatchAdded }: AddMatchProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({
    id: null as number | null,
    date: "",
    time: "",
    opponent: "",
    venue: "",
    result: "",
    competition: "",
    isHome: true,
    home_team_id: "" as number | "",
    away_team_id: "" as number | "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Fetch teams on mount for dropdowns
    fetch("/.netlify/functions/getTeams") // adjust endpoint as needed
      .then((res) => res.json())
      .then((data) => {
        setTeams(data);
      })
      .catch(() => {
        setTeams([]);
      });
  }, []);

  // Update form field with check to clear opponent or teams mutually
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "home_team_id" || name === "away_team_id") {
      // When teams selected, clear opponent
      setForm((f) => ({
        ...f,
        [name]: value === "" ? "" : Number(value),
        opponent: "",
      }));
    } else if (name === "opponent") {
      // When opponent entered, clear teams
      setForm((f) => ({
        ...f,
        opponent: value,
        home_team_id: "",
        away_team_id: "",
      }));
    } else {
      setForm((f) => ({
        ...f,
        [name]: value,
      }));
    }
  };

  // Validation to ensure teams or opponent
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      (!form.home_team_id || !form.away_team_id) &&
      form.opponent.trim() === ""
    ) {
      setError("Please select both teams or enter an opponent.");
      return;
    }
    if (
      form.home_team_id &&
      form.away_team_id &&
      form.home_team_id === form.away_team_id
    ) {
      setError("Home and away teams cannot be the same.");
      return;
    }
    if (!form.date || !form.time || !form.venue) {
      setError("Please enter date, time, and venue.");
      return;
    }

    setLoading(true);

    // Prepare payload with correct field types
    const payload = {
      ...form,
      home_team_id: form.home_team_id === "" ? null : form.home_team_id,
      away_team_id: form.away_team_id === "" ? null : form.away_team_id,
      opponent: form.opponent === "" ? null : form.opponent,
      isHome: form.isHome,
    };

    try {
      const res = await fetch("/.netlify/functions/addMatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Match added!");
        setForm({
          id: null,
          date: "",
          time: "",
          opponent: "",
          venue: "",
          result: "",
          competition: "",
          isHome: true,
          home_team_id: "",
          away_team_id: "",
        });
        if (onMatchAdded) onMatchAdded();
      } else {
        setError(data.error || "Error adding match.");
      }
    } catch (err) {
      setError("An unknown error occurred.");
    } finally {
      setLoading(false);
    }
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

      <label className="block mb-1 font-semibold">Home Team</label>
      <select
        name="home_team_id"
        value={form.home_team_id}
        onChange={handleChange}
        disabled={!!form.opponent}
        className="w-full p-2 border rounded mb-3"
      >
        <option value="">-- Select Home Team --</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>

      <label className="block mb-1 font-semibold">Away Team</label>
      <select
        name="away_team_id"
        value={form.away_team_id}
        onChange={handleChange}
        disabled={!!form.opponent}
        className="w-full p-2 border rounded mb-3"
      >
        <option value="">-- Select Away Team --</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        name="opponent"
        placeholder="Opponent (for external matches)"
        value={form.opponent}
        onChange={handleChange}
        disabled={!!form.home_team_id || !!form.away_team_id}
        className="w-full p-2 border rounded mb-3"
      />

      <input
        type="text"
        name="venue"
        value={form.venue}
        onChange={handleChange}
        placeholder="Venue"
        required
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
      <label className="flex items-center mb-3">
        <input
          type="checkbox"
          name="isHome"
          checked={form.isHome}
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
