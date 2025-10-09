import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, Search } from "lucide-react";

const API_BASE = "/.netlify/functions";

export default function MatchCentre() {
  const { id } = useParams();
  const [match, setMatch] = useState<any>(null);
  const [lineups, setLineups] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [teamMap, setTeamMap] = useState<any>({});
  const [playingTeamIds, setPlayingTeamIds] = useState<number[]>([]);
  const [isAdmin, setIsAdmin] = useState(true); // replace with real auth check

  // Modal + selection state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | "">("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // Match
        const matchRes = await fetch(`${API_BASE}/getMatch?id=${id}`);
        if (matchRes.ok) {
          const data = await matchRes.json();
          setMatch(data);
          
          if (data.teams) {
            setPlayingTeamIds(data.teams.map((t: any) => t.id));
            const teamObj: any = {};
            data.teams.forEach((t: any) => {
            teamObj[t.id] = { id: t.id, name: t.name || `Team ${t.id}` };
            });
            setTeamMap(teamObj);
            
          }
        }

        // Players
        const playerRes = await fetch(`${API_BASE}/getPlayers`);
        if (playerRes.ok) {
          const players = await playerRes.json();
          setAllPlayers(players);
        }

        // Lineups
        const lineupRes = await fetch(`${API_BASE}/getLineup?match_id=${id}`);
        if (lineupRes.ok) {
          const lineupData = await lineupRes.json();
          setLineups(lineupData || []);
        }

  

      } catch (err) {
        console.error("Error fetching match centre data", err);
      }
    }
    fetchData();
  }, [id]);

  async function handleSubmitPlayers() {
    if (!selectedPlayers.length || selectedTeamId === "") {
      alert("Select at least one player and a team.");
      return;
    }

    try {
      const response = await fetch("/.netlify/functions/addPlayerToMatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: match?.id,
          team_id: selectedTeamId,
          player_ids: selectedPlayers,
        }),
      });

      if (response.ok) {
        const lineupRes = await fetch(`${API_BASE}/getLineup?match_id=${match?.id}`);
        if (lineupRes.ok) {
          const lineupData = await lineupRes.json();
          setLineups(lineupData || []);
        }
        alert("Players successfully assigned!");
        setSelectedPlayers([]);
        setSelectedTeamId("");
        setIsModalOpen(false);
      }
    } catch (err) {
      alert("Error assigning players: " + (err as Error).message);
    }
  }

  // Filter players by search
  const filteredPlayers = allPlayers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {match ? (
        <div>
          <h1 className="text-2xl font-bold mb-4">{match.name}</h1>
          <div className="space-y-2 mb-6">
            <div className="flex items-center space-x-2">
              <Calendar size={18} /> <span>{match.date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={18} /> <span>{match.time}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin size={18} /> <span>{match.location}</span>
            </div>
          </div>

          {/* Assign Players button */}
          {isAdmin && (
            <div className="text-center my-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Assign Players
              </button>
            </div>
          )}

          {/* Lineups */}
          <div className="grid md:grid-cols-2 gap-6">
            {playingTeamIds.map((teamId) => (
              <div key={teamId} className="border rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users size={18} /> {teamMap[teamId]?.name || "Team"}
                </h2>
                <ul className="space-y-2">
                  {lineups
                    .filter((p) => p.team_id === teamId)
                    .map((p) => (
                      <li key={p.id} className="flex items-center gap-2">
                        <img
                          src={p.photo}
                          alt={p.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span>
                          {p.name} ({p.position})
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg">
                <h2 className="text-lg font-bold mb-4">Select Players</h2>

                {/* Search bar */}
                <div className="flex items-center border rounded px-2 mb-4">
                  <Search size={18} className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none py-2"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredPlayers.map((player) => (
                    <label
                      key={player.id}
                      className="flex items-center space-x-2 border-b py-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlayers.includes(player.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlayers([...selectedPlayers, player.id]);
                          } else {
                            setSelectedPlayers(
                              selectedPlayers.filter((id) => id !== player.id)
                            );
                          }
                        }}
                      />
                      <img
                        src={player.photo}
                        alt={player.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>
                        {player.name} ({player.position})
                      </span>
                    </label>
                  ))}
                </div>

                {/* Select team */}
                <div className="mt-4">
                  <select
                    value={selectedTeamId}
                    onChange={(e) =>
                      setSelectedTeamId(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="border rounded px-3 py-1 w-full"
                  >
                    <option value="">Select team</option>
                    {playingTeamIds.map((teamId) => (
                      <option key={teamId} value={teamId}>
                        {teamMap[teamId].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitPlayers}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>Loading match details...</p>
      )}

      <div className="mt-6">
        <Link to="/matches" className="text-blue-600 hover:underline">
          ← Back to Matches
        </Link>
      </div>
    </div>
  );
}