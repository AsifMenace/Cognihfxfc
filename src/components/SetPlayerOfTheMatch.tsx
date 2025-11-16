import React, { useState, useEffect } from "react";

type Props = {
  matchId: number;
  isAdmin: boolean;
};

export const SetPlayerOfTheMatch: React.FC<Props> = ({ matchId, isAdmin }) => {
  const [players, setPlayers] = useState<{ id: number; name: string }[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/.netlify/functions/getPlayers")
      .then((res) => res.json())
      .then(setPlayers)
      .catch(() => setPlayers([]));
  }, []);

  if (!isAdmin) return null;

  const handleSubmit = async () => {
    if (!selectedPlayerId) {
      alert("Please select a player");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/.netlify/functions/setPlayerOfTheMatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          player_id: selectedPlayerId,
        }),
      });

      if (!res.ok) throw new Error("Failed to set player");
      alert("Player of the Match set!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-800 via-slate-900 to-black py-10">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <h3 className="text-2xl font-black text-white mb-6 tracking-tight">
          Player of the Match
        </h3>

        {/* Select Field */}
        <div className="mb-5">
          <select
            className={`
              w-full p-4 text-lg bg-slate-800/50 border-2 rounded-xl
              text-white placeholder-gray-400
              focus:outline-none focus:ring-4 focus:ring-yellow-500/50
              transition-all duration-200
              ${!selectedPlayerId ? "border-slate-600" : "border-yellow-500/60"}
            `}
            value={selectedPlayerId ?? ""}
            onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
          >
            <option value="" disabled className="text-gray-500">
              Select a player...
            </option>
            {players.map((player) => (
              <option
                key={player.id}
                value={player.id}
                className="bg-slate-700 text-white"
              >
                {player.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`
            w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-lg
            transition-all duration-300 transform
            ${
              loading
                ? "bg-slate-600 cursor-not-allowed"
                : "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 hover:scale-105 hover:shadow-2xl"
            }
            text-black shadow-lg disabled:transform-none
          `}
        >
          {loading ? "Saving..." : "Set Player of the Match"}
        </button>

        {/* Error Message */}
        {error && (
          <p className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-lg border border-red-700/50 text-center">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
