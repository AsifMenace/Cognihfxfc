import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, MapPin, Clock } from "lucide-react";
import CountdownTimer from "../components/CountdownTimer";

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
}

const MatchCentre = () => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [lineups, setLineups] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE =
    process.env.NODE_ENV === "development"
      ? "https://feature-vs-new--cognihfxfc.netlify.app/.netlify/functions"
      : "/.netlify/functions";

  useEffect(() => {
    async function fetchData() {
      try {
        const [matchRes, lineupRes] = await Promise.all([
          fetch(`${API_BASE}/getMatch/${id}`),
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

  if (loading)
    return <div className="text-center py-12">Loading match details...</div>;

  if (error)
    return <div className="text-center py-12 text-red-600">Error: {error}</div>;

  if (!match)
    return (
      <div className="text-center py-12 text-red-600">Match not found.</div>
    );

  const kickoffDate = new Date(`${match.date}T${match.time || "00:00"}`);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Match Header */}
        <div className="bg-white rounded-xl shadow-lg mb-8 p-6 flex flex-col items-center">
          <div className="text-2xl md:text-3xl font-bold mb-2 text-blue-900">
            Cogni Hfx FC vs {match.opponent}
          </div>

          <CountdownTimer kickOff={kickoffDate} />

          <div className="flex flex-wrap justify-center space-x-4 text-slate-700 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {match.competition}
            </span>
            <span className="flex items-center">
              <Calendar size={16} className="mr-1 text-blue-600" />
              {new Date(match.date).toLocaleDateString("en-US", {
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
              <div
                key={player.id}
                className="bg-slate-50 rounded-xl p-4 text-center hover:shadow-lg transition"
              >
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-16 h-16 rounded-full mx-auto object-cover mb-2"
                />
                <div className="font-bold">{player.name}</div>
                <div className="text-xs text-slate-600 mb-1">
                  {player.position} #{player.jerseyNumber}
                </div>
              </div>
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
