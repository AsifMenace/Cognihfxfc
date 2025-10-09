import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const API_BASE = "/.netlify/functions";

export default function MatchCentre() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [assigningTeam, setAssigningTeam] = useState<"home" | "away" | null>(
    null
  );

  const isAdmin = true; // replace with your real auth

  // Fetch match + players
  useEffect(() => {
    const fetchData = async () => {
      const matchResp = await fetch(`${API_BASE}/getMatch?id=${id}`);
      const matchData = await matchResp.json();
      setMatch(matchData);

      const playersResp = await fetch(`${API_BASE}/getPlayers`);
      const playersData = await playersResp.json();
      setPlayers(playersData);
    };
    fetchData();
  }, [id]);

  // Pre-check players already assigned when opening modal
  useEffect(() => {
    if (assigningTeam && match) {
      const alreadyAssigned =
        assigningTeam === "home"
          ? match.home_players?.map((p: any) => p.id.toString()) || []
          : match.away_players?.map((p: any) => p.id.toString()) || [];

      setSelectedPlayers(alreadyAssigned);
    }
  }, [assigningTeam, match]);

  // Assign players
  const handleAssignPlayers = async () => {
    if (!match || !assigningTeam) return;

    const resp = await fetch(`${API_BASE}/assignPlayersToMatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: match.id,
        players: selectedPlayers,
        team: assigningTeam,
      }),
    });

    if (resp.ok) {
      const updatedMatch = await resp.json();
      setMatch(updatedMatch);
      setSuccessMessage(
        `Players assigned successfully to ${assigningTeam} team!`
      );
      setTimeout(() => setSuccessMessage(null), 3000);

      setIsPlayerModalOpen(false);
      setAssigningTeam(null);
      setSelectedPlayers([]);
    } else {
      console.error("Error assigning players");
    }
  };

  if (!match) {
    return <p className="text-center mt-10">Loading match...</p>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{match.competition}</h1>
      <p className="mb-2">
        {match.date} @ {match.time} — {match.venue}
      </p>
      <p className="mb-4">
        {match.home_team} vs {match.away_team}
      </p>

      {successMessage && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">
          {successMessage}
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setAssigningTeam("home");
              setIsPlayerModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Assign Home Team Players
          </button>

          <button
            onClick={() => {
              setAssigningTeam("away");
              setIsPlayerModalOpen(true);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Assign Away Team Players
          </button>
        </div>
      )}

      {/* Show Home / Away Players */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-lg mb-2">Home Team</h2>
          <ul className="list-disc list-inside">
            {match.home_players?.map((p: any) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-2">Away Team</h2>
          <ul className="list-disc list-inside">
            {match.away_players?.map((p: any) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modal */}
      {isPlayerModalOpen && assigningTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              Select {assigningTeam === "home" ? "Home" : "Away"} Team Players
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAssignPlayers();
              }}
            >
              <div className="max-h-64 overflow-y-auto space-y-2">
                {players.map((p) => (
                  <label key={p.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={p.id}
                      checked={selectedPlayers.includes(p.id.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlayers([
                            ...selectedPlayers,
                            p.id.toString(),
                          ]);
                        } else {
                          setSelectedPlayers(
                            selectedPlayers.filter((id) => id !== p.id.toString())
                          );
                        }
                      }}
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end mt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlayerModalOpen(false);
                    setAssigningTeam(null);
                    setSelectedPlayers([]);
                  }}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}