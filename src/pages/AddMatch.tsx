import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getAdminHeaders } from "../utils/auth";
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
    video_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { id } = useParams<{ id?: string }>(); // <-- add this line

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

  useEffect(() => {
    if (id) {
      // Fetch match details to prefill form for editing
      fetch(`/.netlify/functions/getMatch?id=${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.match) {
            setForm({
              id: data.match.id,
              date: data.match.date || "",
              time: data.match.time || "",
              opponent: data.match.opponent || "",
              venue: data.match.venue || "",
              result: data.match.result || "",
              competition: data.match.competition || "",
              isHome: data.match.isHome ?? true,
              home_team_id: data.match.home_team_id ?? "",
              away_team_id: data.match.away_team_id ?? "",
              video_url: data.match.video_url ?? "", // <-- add this
            });
          }
        })
        .catch(() => {
          setError("Failed to load match data for editing");
        });
    }
  }, [id]);

  // Auto-populate competition with "League Month YYYY" when date changes,
  // unless the user has set a custom value (non-league tag like "Cup").
  useEffect(() => {
    if (!form.date) return;
    const isAutoLeague = !form.competition || /^League \w+ \d{4}$/.test(form.competition);
    if (!isAutoLeague) return;
    const [year, month] = form.date.split("-");
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    setForm((f) => ({ ...f, competition: `League ${label}` }));
  }, [form.date]);

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
    } else if (name === "isHome") {
      // Checkbox returns value via checked property, use e.target.checked
      setForm((f) => ({
        ...f,
        isHome: (e.target as HTMLInputElement).checked,
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
      video_url: form.video_url === "" ? null : form.video_url, // <-- add this
    };

    try {
      const res = await fetch("/.netlify/functions/addMatches", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(id ? "Match updated!" : "Match added!");
        if (!id) {
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
            video_url: "",
          });
        }
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

  const inputCls = "w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none mb-3 disabled:opacity-50 disabled:cursor-not-allowed";
  const labelCls = "block mb-1 text-sm font-bold text-gray-300";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-black text-yellow-400 text-center mb-8">
          {id ? "EDIT MATCH" : "ADD MATCH"}
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 md:p-8 space-y-2 shadow-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Kick-off Time</label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                required
                className={inputCls}
              />
            </div>
          </div>

          <label className={labelCls}>Home Team</label>
          <select
            name="home_team_id"
            value={form.home_team_id}
            onChange={handleChange}
            disabled={!!form.opponent}
            className={inputCls}
          >
            <option value="">-- Select Home Team --</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <label className={labelCls}>Away Team</label>
          <select
            name="away_team_id"
            value={form.away_team_id}
            onChange={handleChange}
            disabled={!!form.opponent}
            className={inputCls}
          >
            <option value="">-- Select Away Team --</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-slate-600" />
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">or</span>
            <div className="flex-1 border-t border-slate-600" />
          </div>

          <label className={labelCls}>Opponent (external match)</label>
          <select
            name="opponent"
            value={form.opponent}
            onChange={handleChange}
            disabled={!!form.home_team_id || !!form.away_team_id}
            className={inputCls}
          >
            <option value="">-- Select Opponent --</option>
            {teams
              .filter(
                (team) =>
                  !["Red", "Blue", "Black", "Cogni HFX FC"].includes(team.name)
              )
              .map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
          </select>

          <label className={labelCls}>Venue</label>
          <input
            type="text"
            name="venue"
            value={form.venue}
            onChange={handleChange}
            placeholder="Venue"
            required
            className={inputCls}
          />

          <label className={labelCls}>
            Competition{" "}
            <span className="text-gray-500 font-normal text-xs">
              (e.g. Cup, Friendly — leave blank, league is automatic by month)
            </span>
          </label>
          <input
            type="text"
            name="competition"
            value={form.competition}
            onChange={handleChange}
            placeholder="e.g. Cup, Friendly (optional)"
            className={inputCls}
          />

          <label className={labelCls}>Result (e.g. 2-1)</label>
          <input
            type="text"
            name="result"
            value={form.result}
            onChange={handleChange}
            placeholder="e.g. 2-1"
            className={inputCls}
          />

          <label className={labelCls}>Video URL</label>
          <input
            type="url"
            name="video_url"
            value={form.video_url}
            onChange={handleChange}
            placeholder="YouTube or other video URL"
            className={inputCls}
          />

          <label className="flex items-center gap-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              name="isHome"
              checked={form.isHome}
              onChange={handleChange}
              className="w-4 h-4 accent-yellow-400"
            />
            <span className="text-gray-300 font-medium">Home match</span>
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black rounded-lg hover:scale-105 transition-all disabled:opacity-50 mt-2"
          >
            {loading
              ? id ? "Updating..." : "Adding..."
              : id ? "UPDATE MATCH" : "ADD MATCH"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/games"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold rounded-full hover:scale-105 transition-all shadow-lg"
          >
            ← Back to Games
          </Link>
        </div>
      </div>
    </div>
  );
}
