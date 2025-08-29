import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, MapPin, Clock } from "lucide-react";
import CountdownTimer from "../components/CountdownTimer";
import { parseMatchDateTime } from "../components/dateUtils";

type MatchCentreProps = {
  isAdmin: boolean;
};

interface Player {
  id: number;
  name: string;
  photo: string;
  position: string;
  jerseyNumber: number;
  team_id?: number | null;
}

interface Match {
  id: number;
  date: string;
  time: string;
  opponent?: string | null;
  venue: string;
  competition: string;
  isHome: boolean;
  result?: string;
  home_team_id?: number | null;
  away_team_id?: number | null;
  home_team_name?: string | null;
  home_team_color?: string | null;
  away_team_name?: string | null;
  away_team_color?: string | null;
}

const MatchCentre: React.FC<MatchCentreProps> = ({ isAdmin }) => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [lineups, setLineups] = useState<Player[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | "">("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [loadingAdd, setLoadingAdd] = useState(false); // for submission state
  const [success, setSuccess] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const API_BASE =
    process.env.NODE_ENV === "development"
      ? "/.netlify/functions"
      : "/.netlify/functions";

  // Fetch all players
  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch(`${API_BASE}/getPlayers`);
        if (!res.ok) throw new Error("Failed to fetch players");
        const data = await res.json();
        setAllPlayers(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchPlayers();
  }, [API_BASE]);

  // Fetch match and lineup
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

  type Scorer = {
    id: number;
    player_id: number;
    player_name: string;
    team_name: string;
    team_id: number;
  };

  const [scorers, setScorers] = useState<Scorer[]>([]);

  async function fetchScorers() {
    if (!match) return;
    try {
      const res = await fetch(
        `/.netlify/functions/getMatchGoals?matchId=${match.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch goal scorers");
      const data: Scorer[] = await res.json();
      setScorers(data);
    } catch (e) {
      console.error("Failed to load scorers", e);
    }
  }

  useEffect(() => {
    fetchScorers();
  }, [match]);

  // Remove player handler
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
        const data = await res.json();
        setLineups(data.lineup); // update lineup state with fresh data
        alert(data.message || "Player removed successfully");
      } else {
        const data = await res.json();
        alert(`Failed to remove player: ${data.error || res.statusText}`);
      }
    } catch (error) {
      alert(`Failed to remove player: ${(error as Error).message}`);
    }
  }

  // Handle add player form submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const playerIdValue = formData.get("playerId");

    const teamIdValue = selectedTeamId;

    if (!playerIdValue || typeof playerIdValue !== "string") {
      alert("Please select a valid player.");
      return;
    }
    if (teamIdValue === "") {
      alert("Please select a team.");
      return;
    }

    const playerIdNum = Number(playerIdValue);

    if (lineups.some((p) => p.id === playerIdNum)) {
      alert("This player is already added to the match.");
      return; // Stop submitting
    }

    if (!playerIdValue || typeof playerIdValue !== "string") {
      alert("Please select a valid player.");
      return;
    }

    try {
      const response = await fetch("/.netlify/functions/addPlayerToMatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: match?.id,
          player_id: playerIdNum,
          team_id: teamIdValue,
        }),
      });

      if (response.ok) {
        const lineupRes = await fetch(
          `${API_BASE}/getLineup?match_id=${match?.id}`
        );
        if (lineupRes.ok) {
          const lineupData = await lineupRes.json();
          setLineups(lineupData || []);
        }
        alert("Player successfully added to the match!");
        formRef.current?.reset();
        setSelectedTeamId("");
      } else {
        const errData = await response.json();
        alert(`Failed to add player: ${errData.error || "Unknown error"}`);
      }
    } catch (err) {
      alert(`Error adding player: ${(err as Error).message}`);
    }
  };

  if (loading)
    return <div className="text-center py-12">Loading match details...</div>;

  if (error)
    return <div className="text-center py-12 text-red-600">Error: {error}</div>;

  if (!match)
    return (
      <div className="text-center py-12 text-red-600">Match not found.</div>
    );

  const kickoffDate = parseMatchDateTime(match);
  const teamMap: { [id: number]: { name: string; colorClass: string } } = {
    1: { name: "Red", colorClass: "text-red-600" },
    2: { name: "Black", colorClass: "text-gray-700" },
    3: { name: "Blue", colorClass: "text-blue-600" },
  };

  const playingTeamIds = [match?.home_team_id, match?.away_team_id].filter(
    (id): id is number => typeof id === "number"
  );

  const groupedLineups = {
    Red: lineups.filter((p) => p.team_id === 1),
    Black: lineups.filter((p) => p.team_id === 2),
    Blue: lineups.filter((p) => p.team_id === 3),
  };

  const homeScorers = scorers.filter(
    (s) => s.team_name === match?.home_team_name
  );
  const awayScorers = scorers.filter(
    (s) => s.team_name === match?.away_team_name
  );

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!match) return;

    setLoadingAdd(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/.netlify/functions/addMatchGoal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: match.id,
          player_id: Number(selectedPlayerId),
          team_id: Number(selectedTeamId),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add goal scorer");
      }

      setSuccess("Goal scorer added successfully!");
      await fetchScorers();
      // Optionally reset selections
      setSelectedPlayerId("");
      setSelectedTeamId("");

      // TODO: Refresh goal scorers list here (covered in step 2)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingAdd(false);
    }
  }

  async function handleRemoveGoal(goalId: number, playerId: number) {
    if (!window.confirm("Are you sure you want to remove this goal?")) return;

    try {
      const res = await fetch("/.netlify/functions/removeMatchGoal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal_id: goalId, player_id: playerId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to remove goal");
      }

      // Refresh the scorer list after removing
      await fetchScorers();
    } catch (error) {
      alert(`Error removing goal: ${(error as Error).message}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Match Header */}
        <div className="bg-white rounded-xl shadow-lg mb-8 p-6 flex flex-col items-center">
          <div className="text-2xl md:text-3xl font-bold mb-2 text-blue-900 flex justify-center items-center space-x-4">
            {match?.home_team_name && match?.away_team_name ? (
              <>
                <span style={{ color: match?.home_team_color ?? "black" }}>
                  {match?.home_team_name}
                </span>
                <span className="text-slate-400">vs</span>
                <span style={{ color: match?.away_team_color ?? "black" }}>
                  {match?.away_team_name}
                </span>
              </>
            ) : (
              <>
                <span className="text-blue-600 font-bold">Cogni Hfx FC</span>
                <span className="text-slate-400 mx-2">vs</span>
                <span>{match?.opponent}</span>
              </>
            )}
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
          <Link
            to={`/match/edit/${match.id}`}
            className="text-blue-600 hover:underline"
          >
            Edit Match
          </Link>
        )}
        <div className="flex justify-between mb-8 max-w-3xl mx-auto px-4">
          {/* Home/Red Team scorers */}
          <div className="w-1/3 text-left text-red-700">
            <h3
              className="font-bold mb-2"
              style={{ color: match?.home_team_color ?? "red" }}
            >
              {match?.home_team_name} Goal Scorers
            </h3>
            {homeScorers.length === 0 ? (
              <p className="text-gray-400">No goals yet</p>
            ) : (
              <ul>
                {homeScorers.map((scorer) => (
                  <li
                    key={scorer.id}
                    className="flex justify-between items-center"
                  >
                    <span>{scorer.player_name}</span>
                    {isAdmin && (
                      <button
                        onClick={() =>
                          handleRemoveGoal(scorer.id, scorer.player_id)
                        }
                        aria-label={`Remove goal by ${scorer.player_name}`}
                        className="ml-4 p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-600"
                        type="button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-600 hover:text-gray-800"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4"
                          />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Away/Black Team scorers */}
          <div
            className="w-1/3 text-right"
            style={{ color: match?.away_team_color ?? "black" }}
          >
            <h3 className="font-bold mb-2">
              {match?.away_team_name} Goal Scorers
            </h3>
            {awayScorers.length === 0 ? (
              <p className="text-gray-400">No goals yet</p>
            ) : (
              <ul>
                {awayScorers.map((scorer) => (
                  <li
                    key={scorer.id}
                    className="flex justify-between items-center"
                  >
                    <span>{scorer.player_name}</span>
                    {isAdmin && (
                      <button
                        onClick={() =>
                          handleRemoveGoal(scorer.id, scorer.player_id)
                        }
                        aria-label={`Remove goal by ${scorer.player_name}`}
                        className="ml-4 p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-600"
                        type="button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-800 hover:text-gray-800"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4"
                          />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {isAdmin && (
          <section className="my-8 p-6 max-w-md mx-auto border rounded shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-4">Add Goal Scorer</h2>

            <form
              onSubmit={handleAddGoal}
              className="mb-6 flex flex-wrap items-center space-x-2"
            >
              <label htmlFor="playerId" className="block mb-2 font-semibold">
                Select Player:
              </label>

              <select
                id="playerId"
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="border rounded px-3 py-1"
                required
              >
                <option value="" disabled>
                  Select a player
                </option>
                {allPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.position})
                  </option>
                ))}
              </select>

              <label htmlFor="teamId" className="block mb-2 font-semibold">
                Select Team:
              </label>

              <select
                id="teamId"
                value={selectedTeamId}
                onChange={(e) =>
                  setSelectedTeamId(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="border rounded px-3 py-1"
                required
              >
                <option value="" disabled>
                  Select a team
                </option>
                {match?.home_team_id && (
                  <option value={match.home_team_id}>
                    {match.home_team_name}
                  </option>
                )}
                {match?.away_team_id && (
                  <option value={match.away_team_id}>
                    {match.away_team_name}
                  </option>
                )}
              </select>

              <button
                type="submit"
                disabled={loadingAdd}
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingAdd ? "Adding..." : "Add Goal Scorer"}
              </button>
              {error && (
                <div className="mb-4 p-2 text-red-800 bg-red-100 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-2 text-green-800 bg-green-100 rounded">
                  {success}
                </div>
              )}
            </form>
          </section>
        )}
        {isAdmin && (
          <section className="my-8 p-6 max-w-md mx-auto border rounded shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-4">Update Match Result</h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const resultValue = formData.get("result");

                if (resultValue === null || typeof resultValue !== "string") {
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
                  setTimeout(() => setSuccessMessage(null), 3000);
                }
              }}
            >
              {successMessage && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">
                  {successMessage}
                </div>
              )}

              <label className="block mb-2 font-semibold">
                Update Result:
                <input
                  name="result"
                  defaultValue={match.result || ""}
                  placeholder="e.g. 2-1"
                  className="border rounded ml-2 px-3 py-1"
                />
              </label>

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </form>
          </section>
        )}

        {/* Lineups Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 text-center">
            Line Ups
          </h2>

          {playingTeamIds.map((teamId) => {
            const { name: teamName, colorClass } = teamMap[teamId];
            const teamPlayers =
              groupedLineups[teamName as keyof typeof groupedLineups] || [];

            return (
              <div key={teamId} className="mb-6">
                <h3 className={`font-bold mb-2 ${colorClass}`}>
                  {teamName} Team
                </h3>
                {teamPlayers.length === 0 ? (
                  <div className="text-slate-500 text-center">
                    No players assigned.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {teamPlayers.map((player) => (
                      <div key={player.id} className="relative group">
                        <Link
                          to={`/player/${player.id}`}
                          className="block bg-slate-50 rounded-xl p-4 text-center hover:shadow-lg transition"
                        >
                          <div className="mb-4">
                            <img
                              src={player.photo}
                              alt={player.name}
                              className="w-16 h-16 rounded-full mx-auto object-cover mb-2 object-top"
                            />
                            <div className="font-bold">{player.name}</div>
                            <div className="text-xs text-slate-600 mb-1">
                              {player.position} #{player.jerseyNumber}
                            </div>
                          </div>
                        </Link>

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
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isAdmin && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="mb-6 flex flex-wrap items-center space-x-2"
          >
            <label htmlFor="playerId" className="block mb-2 font-semibold">
              Add Player to Match
            </label>

            <select
              name="playerId"
              id="playerId"
              className="border rounded px-3 py-1"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select a player
              </option>
              {allPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.position})
                </option>
              ))}
            </select>

            <select
              name="teamId"
              id="teamId"
              className="border rounded px-3 py-1"
              required
              value={selectedTeamId}
              onChange={(e) =>
                setSelectedTeamId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            >
              <option value="" disabled>
                Select a team
              </option>
              <option value={1}>Red</option>
              <option value={2}>Black</option>
              <option value={3}>Blue</option>
            </select>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Add Player
            </button>
          </form>
        )}
        {/* Back link */}
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
