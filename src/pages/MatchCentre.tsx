import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, MapPin, Clock } from "lucide-react";
import CountdownTimer from "../components/CountdownTimer";
import { parseMatchDateTime } from "../components/dateUtils";

type MatchCentreProps = {
  isAdmin: boolean;
};

// Countdown Timer Component

interface Player {
  id: number;
  name: string;
  photo: string;
  position: string;
  jerseyNumber: number;
}

interface Match {
  id: number;
  date: string;
  time: string;
  opponent: string;
  venue: string;
  competition: string;
  isHome: boolean;
  result?: string;
}

const MatchCentre: React.FC<MatchCentreProps> = ({ isAdmin }) => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [lineups, setLineups] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_BASE =
    process.env.NODE_ENV === "development"
      ? "https://feature-vs-new--cognihfxfc.netlify.app/.netlify/functions"
      : "/.netlify/functions";

  useEffect(() => {
    async function fetchData() {
      try {
        const [matchRes, lineupRes] = await Promise.all([
          fetch(`/.netlify/functions/getMatch?id=${id}`),
          fetch(`${API_BASE}/getLineup?match_id=${id}`),
        ]);

        if (!matchRes.ok) throw new Error("Failed to fetch match details");
        if (!lineupRes.ok) throw new Error("Failed to fetch lineup");

        const matchData = await matchRes.json();
        const lineupData = await lineupRes.json();

        setMatch(matchData.match || null);
        setLineups(lineupData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, API_BASE]);

  async function handleRemovePlayer(playerId: number) {
    if (
      !window.confirm(
        "Are you sure you want to remove this player from the match?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/removePlayerFromMatch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: match?.id, player_id: playerId }),
      });

      if (res.ok) {
        // Remove player from local lineup state to update UI instantly
        setLineups((prev) => prev.filter((p) => p.id !== playerId));
      } else {
        const data = await res.json();
        alert(`Failed to remove player: ${data.error || res.statusText}`);
      }
    } catch (error) {
      alert(`Failed to remove player: ${(error as Error).message}`);
    }
  }

  if (loading)
    return <div className="text-center py-12">Loading match details...</div>;

  if (error)
    return <div className="text-center py-12 text-red-600">Error: {error}</div>;

  if (!match)
    return (
      <div className="text-center py-12 text-red-600">Match not found.</div>
    );

  const kickoffDate = parseMatchDateTime(match);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Match Header */}
        <div className="bg-white rounded-xl shadow-lg mb-8 p-6 flex flex-col items-center">
          <div className="text-2xl md:text-3xl font-bold mb-2 text-blue-900">
            Cogni Hfx FC vs {match.opponent}
          </div>
          <div className="text-xl md:text-2xl font-semibold text-green-700 mb-4">
            {match.result ? `Result: ${match.result}` : "Result not available"}
          </div>

          <CountdownTimer kickOff={kickoffDate} />

          <div className="flex flex-wrap justify-center space-x-4 text-slate-700 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {match.competition}
            </span>
            <span className="flex items-center">
              <Calendar size={16} className="mr-1 text-blue-600" />
              {kickoffDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center">
              <Clock size={16} className="mr-1 text-blue-600" />
              {match.time}
            </span>
            <span className="flex items-center">
              <MapPin size={16} className="mr-1 text-blue-600" />
              {match.venue}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-bold ${
                match.isHome
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {match.isHome ? "Home" : "Away"}
            </span>
          </div>
        </div>

        {isAdmin && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const resultValue = formData.get("result");

              if (resultValue === null || typeof resultValue !== "string") {
                // Handle empty or invalid input gracefully, e.g., ignore update or show error
                return;
              }

              const resp = await fetch(`${API_BASE}/updateMatchResult`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: match.id, result: resultValue }),
              });

              if (resp.ok) {
                setMatch({ ...match, result: resultValue });
                setSuccessMessage("Match result updated successfully!");
                // Optionally clear message after some seconds:
                setTimeout(() => setSuccessMessage(null), 3000);
              }
            }}
            style={{ marginTop: 16 }}
          >
            {successMessage && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">
                {successMessage}
              </div>
            )}

            <label>
              Update Result:{" "}
              <input
                name="result"
                defaultValue={match.result || ""}
                placeholder="e.g. 2-1"
                style={{ marginRight: 8 }}
              />
            </label>
            <button type="submit">Save</button>
          </form>
        )}

        {/* Lineups Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 text-center">
            Line Ups
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {lineups.length === 0 && (
              <div className="text-slate-500 text-center">
                Line ups coming soon.
              </div>
            )}
            {lineups.map((player) => (
              <Link
                key={player.id}
                to={`/player/${player.id}`}
                className="group"
              >
                <div className="bg-slate-50 rounded-xl p-4 text-center hover:shadow-lg transition">
                  <div className="relative mb-4">
                    <img
                      src={player.photo}
                      alt={player.name}
                      className="w-16 h-16 rounded-full mx-auto object-cover mb-2"
                    />
                    <div className="font-bold">{player.name}</div>
                    <div className="text-xs text-slate-600 mb-1">
                      {player.position} #{player.jerseyNumber}
                      {/* Remove button for admins */}
                      {isAdmin && (
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                          title="Remove player from match"
                        >
                          ✖
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/games" className="text-blue-600 hover:underline">
            ← Back to Games
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MatchCentre;
