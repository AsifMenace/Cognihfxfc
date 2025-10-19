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
    // Fetch players (or better: fetch only players who played in match)
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
    <div className="my-8 p-6 max-w-md mx-auto border rounded shadow-sm bg-white">
      <h3 className="font-bold mb-2">Set Player of the Match</h3>
      <select
        className="w-full p-2 border rounded mb-3"
        value={selectedPlayerId ?? ""}
        onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
      >
        <option value="" disabled>
          Select Player
        </option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
      </select>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save"}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};
