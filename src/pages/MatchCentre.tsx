import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, MapPin, Clock } from "lucide-react";
import CountdownTimer from "../components/CountdownTimer";
import { parseMatchDateTime } from "../components/dateUtils";
import Select, { MultiValue } from "react-select";
import MatchVideoEmbed from "../components/MatchVideoEmbed";
import { SectionHeader } from "../components/SectionHeader";
import { SetPlayerOfTheMatch } from "../components/SetPlayerOfTheMatch";
import { PlayerOfTheMatch } from "./PlayerOfTheMatch";
import ThemeProvider from "../components/ThemeProvider";
import Card from "../components/Card";
import Title from "../components/Title";

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
  opponent_id?: number | null;
  opponent_name?: string | null;
  opponent_color?: string | null;
  cogni_id?: number | null;
  cogni_name?: string | null;
  cogni_color?: string | null;
  video_url?: string | null;
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
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  type PlayerOption = {
    value: number;
    label: string;
  };

  const [selectedPlayers, setSelectedPlayers] = useState<
    MultiValue<PlayerOption>
  >([]);

  const API_BASE = "/.netlify/functions";

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
    )
      return;
    try {
      const res = await fetch("/.netlify/functions/removePlayerFromMatch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: match?.id, player_id: playerId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLineups(data.lineup);
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
    if (!selectedPlayers || selectedPlayers.length === 0) {
      alert("Please select at least one valid player.");
      return;
    }
    if (selectedTeamId === "") {
      alert("Please select a team.");
      return;
    }
    const alreadyAdded = selectedPlayers.some((p) =>
      lineups.some((lp) => lp.id === p.value)
    );
    if (alreadyAdded) {
      alert("One or more selected players are already added to the match.");
      return;
    }
    try {
      const playerIds = selectedPlayers.map((p) => p.value);
      const response = await fetch("/.netlify/functions/addPlayerToMatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: match?.id,
          team_id: selectedTeamId,
          player_ids: playerIds,
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
        alert("Players successfully added to the match!");
        setSelectedPlayers([]);
        setSelectedTeamId("");
      } else {
        const errData = await response.json();
        alert(`Failed to add players: ${errData.error || "Unknown error"}`);
      }
    } catch (err) {
      alert(`Error adding players: ${(err as Error).message}`);
    }
  };

  if (loading) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center py-32">
          <div className="text-3xl font-bold text-yellow-400 animate-pulse">
            LOADING MATCH...
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center py-32">
          <div className="text-red-400 text-center">ERROR: {error}</div>
        </div>
      </ThemeProvider>
    );
  }

  if (!match) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center py-32">
          <div className="text-red-400">Match not found.</div>
        </div>
      </ThemeProvider>
    );
  }

  const kickoffDate = parseMatchDateTime(match);
  const playingTeamIds: number[] = [
    match?.home_team_id,
    match?.away_team_id,
  ].filter((id): id is number => typeof id === "number");

  const teamMap: { [id: number]: { name: string; colorClass: string } } = {};
  playingTeamIds.forEach((teamId: number) => {
    let teamName = "";
    let teamColor = "";
    if (teamId === match?.home_team_id) {
      teamName = match.home_team_name || "";
      teamColor = match.home_team_color || "";
    } else if (teamId === match?.away_team_id) {
      teamName = match.away_team_name || "";
      teamColor = match.away_team_color || "";
    }
    teamMap[teamId] = {
      name: teamName,
      colorClass: teamColor || "white",
    };
  });

  const groupedLineups: { [teamName: string]: Player[] } = {};
  Object.values(teamMap).forEach(({ name }) => {
    groupedLineups[name] = [];
  });
  lineups.forEach((player) => {
    const team = teamMap[player.team_id || 0];
    if (team) {
      groupedLineups[team.name].push(player);
    }
  });

  const homeScorers = scorers.filter(
    (s) => s.team_name === match?.home_team_name
  );
  const awayScorers = scorers.filter(
    (s) => s.team_name === match?.away_team_name
  );
  const opponentScorers = scorers.filter(
    (s) => s.team_name === match?.opponent_name
  );
  const cogniScorers = scorers.filter((s) => s.team_name === match?.cogni_name);

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
      setSelectedPlayerId("");
      setSelectedTeamId("");
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
      await fetchScorers();
    } catch (error) {
      alert(`Error removing goal: ${(error as Error).message}`);
    }
  }

  const renderTeamLineup = (
    teamId: number,
    teamName: string,
    colorClass: string,
    teamPlayers: Player[]
  ) => (
    <div key={teamId}>
      <h3 className="text-xl font-black mb-4" style={{ color: colorClass }}>
        {teamName.toUpperCase()}
      </h3>

      {teamPlayers.length === 0 ? (
        <p className="text-gray-500 text-center">No players assigned.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto py-2">
          {teamPlayers.map((player) => (
            <div key={player.id} className="relative group flex-shrink-0 w-40">
              <Link
                to={`/player/${player.id}`}
                className="block bg-slate-700/50 backdrop-blur-sm rounded-xl p-4 text-center hover:scale-105 transition-all border border-slate-600"
              >
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-16 h-16 rounded-full mx-auto object-cover object-top mb-2"
                />
                <div className="font-bold text-white">{player.name}</div>
                <div className="text-xs text-gray-400">
                  {player.position} #{player.jerseyNumber}
                </div>
              </Link>
              {isAdmin && (
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-300 bg-slate-800 rounded-full w-6 h-6 flex items-center justify-center"
                  title="Remove"
                >
                  X
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <ThemeProvider>
      <div className="max-w-4xl mx-auto space-y-8">
        <Title>MATCH CENTRE</Title>
        {/* Match Header */}
        <Card className="border-yellow-500/30">
          <div className="text-center p-6">
            <div className="text-3xl md:text-4xl flex-wrap font-black text-white mb-4 flex justify-center items-center gap-4">
              {match?.home_team_name && match?.away_team_name ? (
                <>
                  <span style={{ color: match?.home_team_color || "#e5e7eb" }}>
                    {match?.home_team_name}
                  </span>
                  <span className="text-gray-400">VS</span>
                  <span style={{ color: match?.away_team_color || "#e5e7eb" }}>
                    {match?.away_team_name}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-yellow-400 font-black">
                    {match?.cogni_name}
                  </span>
                  <span className="text-gray-400 mx-3">VS</span>
                  <span>{match?.opponent_name}</span>
                </>
              )}
            </div>

            <div className="text-2xl font-bold text-green-400 mb-4">
              {match.result ? `RESULT: ${match.result}` : "LIVE"}
            </div>

            <CountdownTimer kickOff={kickoffDate} />

            <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-300 mt-4">
              <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full font-bold">
                {match.competition}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={16} className="text-yellow-400" />
                {kickoffDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={16} className="text-yellow-400" />
                {match.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={16} className="text-yellow-400" />
                {match.venue}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  match.isHome
                    ? "bg-green-600/20 text-green-400"
                    : "bg-orange-600/20 text-orange-400"
                }`}
              >
                {match.isHome ? "HOME" : "AWAY"}
              </span>
            </div>

            {isAdmin && (
              <div className="mt-6">
                <Link
                  to={`/match/edit/${match.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-full hover:scale-105 transition-all shadow-lg"
                >
                  EDIT MATCH
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Goal Scorers */}
        <Card className="border-yellow-500/30 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 md:gap-8">
              {/* LEFT: Team 1 (Home / Cogni) */}
              <div className="text-left">
                <h3
                  className="text-xl md:text-2xl font-black mb-3 uppercase tracking-wider"
                  style={{
                    color:
                      match?.home_team_color || match?.cogni_color || "#e5e7eb",
                  }}
                >
                  SCORERS
                  <div className="h-1 w-16 bg-gradient-to-r from-yellow-500 to-amber-500 rounded mt-1"></div>
                </h3>

                {/* INTERNAL: home_team_name */}
                {match?.home_team_name && (
                  <>
                    {homeScorers.length > 0 ? (
                      <ul className="space-y-1.5 text-sm md:text-base">
                        {homeScorers.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center justify-between text-white"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-yellow-400">⚽</span>
                              <span className="font-bold uppercase truncate max-w-[100px] md:max-w-none">
                                {s.player_name}
                              </span>
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() =>
                                  handleRemoveGoal(s.id, s.player_id)
                                }
                                className="text-red-400 hover:text-red-300 text-xs w-5 h-5"
                              >
                                X
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No goals</p>
                    )}
                  </>
                )}

                {/* EXTERNAL: cogni_name vs opponent */}
                {match?.cogni_name && match?.opponent_id != null && (
                  <>
                    {cogniScorers.length > 0 ? (
                      <ul className="space-y-1.5 text-sm md:text-base">
                        {cogniScorers.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center justify-between text-white"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-yellow-400">⚽</span>
                              <span className="font-bold uppercase truncate max-w-[100px] md:max-w-none">
                                {s.player_name}
                              </span>
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() =>
                                  handleRemoveGoal(s.id, s.player_id)
                                }
                                className="text-red-400 hover:text-red-300 text-xs w-5 h-5"
                              >
                                X
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No goals</p>
                    )}
                  </>
                )}
              </div>

              {/* RIGHT: Team 2 (Away / Opponent) */}
              <div className="text-right">
                <h3
                  className="text-xl md:text-2xl font-black mb-3 uppercase tracking-wider"
                  style={{
                    color:
                      match?.away_team_color ||
                      match?.opponent_color ||
                      "#e5e7eb",
                  }}
                >
                  SCORERS
                  <div className="h-1 w-16 bg-gradient-to-r from-yellow-500 to-amber-500 rounded mt-1 ml-auto"></div>
                </h3>

                {/* INTERNAL: away_team_name */}
                {match?.away_team_name && (
                  <>
                    {awayScorers.length > 0 ? (
                      <ul className="space-y-1.5 text-sm md:text-base">
                        {awayScorers.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center justify-between text-white"
                          >
                            <span className="flex items-center gap-1.5 justify-end">
                              <span className="font-bold uppercase truncate max-w-[100px] md:max-w-none">
                                {s.player_name}
                              </span>
                              <span className="text-yellow-400">⚽</span>
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() =>
                                  handleRemoveGoal(s.id, s.player_id)
                                }
                                className="text-red-400 hover:text-red-300 text-xs w-5 h-5"
                              >
                                X
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No goals</p>
                    )}
                  </>
                )}

                {/* EXTERNAL: opponent_name */}
                {match?.opponent_name && match?.opponent_id != null && (
                  <>
                    {opponentScorers.length > 0 ? (
                      <ul className="space-y-1.5 text-sm md:text-base">
                        {opponentScorers.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center justify-between text-white"
                          >
                            <span className="flex items-center gap-1.5 justify-end">
                              <span className="font-bold uppercase truncate max-w-[100px] md:max-w-none">
                                {s.player_name}
                              </span>
                              <span className="text-yellow-400">⚽</span>
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() =>
                                  handleRemoveGoal(s.id, s.player_id)
                                }
                                className="text-red-400 hover:text-red-300 text-xs w-5 h-5"
                              >
                                X
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No goals</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Player of the Match */}
        <div className="flex justify-center">
          <PlayerOfTheMatch matchId={match.id} />
        </div>

        {/* Video */}
        {match.video_url && (
          <Card className="border-yellow-500/30">
            <SectionHeader title="MATCH HIGHLIGHTS" />
            <div className="p-4">
              <MatchVideoEmbed videoUrl={match.video_url} />
            </div>
          </Card>
        )}

        {/* Admin: Add Goal */}
        {isAdmin && (
          <Card className="border-blue-500/30">
            <h2 className="text-xl font-black text-yellow-400 mb-4 text-center">
              ADD GOAL SCORER
            </h2>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">
                    PLAYER
                  </label>
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none"
                    required
                  >
                    <option value="" disabled>
                      Select player
                    </option>
                    {allPlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.position})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">
                    TEAM
                  </label>
                  {/* In Add Goal form */}
                  <select
                    value={selectedTeamId}
                    onChange={(e) =>
                      setSelectedTeamId(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none"
                    required
                  >
                    <option value="" disabled>
                      Select team
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
                    {match?.cogni_id && (
                      <option value={match.cogni_id}>{match.cogni_name}</option>
                    )}
                    {match?.opponent_id && (
                      <option value={match.opponent_id}>
                        {match.opponent_name}
                      </option>
                    )}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loadingAdd}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg hover:scale-105 transition-all disabled:opacity-50"
              >
                {loadingAdd ? "ADDING..." : "ADD GOAL"}
              </button>
              {error && <p className="text-red-400 text-center">{error}</p>}
              {success && (
                <p className="text-green-400 text-center">{success}</p>
              )}
            </form>
          </Card>
        )}

        {/* Admin: Update Result */}
        {isAdmin && (
          <Card className="border-green-500/30">
            <h2 className="text-xl font-black text-yellow-400 mb-4 text-center">
              UPDATE RESULT
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const resultValue = formData.get("result");
                if (typeof resultValue !== "string") return;
                const resp = await fetch(`${API_BASE}/updateMatchResult`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: match.id, result: resultValue }),
                });
                if (resp.ok) {
                  setMatch({ ...match, result: resultValue });
                  setSuccessMessage("Result updated!");
                  setTimeout(() => setSuccessMessage(null), 3000);
                }
              }}
              className="flex flex-col items-center gap-4"
            >
              <input
                name="result"
                defaultValue={match.result || ""}
                placeholder="e.g. 2-1"
                className="w-full max-w-xs px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 text-center text-xl font-bold focus:border-green-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-full hover:scale-105 transition-all"
              >
                SAVE RESULT
              </button>
              {successMessage && (
                <p className="text-green-400 font-bold animate-pulse">
                  {successMessage}
                </p>
              )}
            </form>
          </Card>
        )}

        {isAdmin && (
          <Card className="border-green-500/30">
            <h2 className="text-xl font-black text-yellow-400 mb-4 text-center">
              PLAYER OF THE MATCH
            </h2>
            <SetPlayerOfTheMatch matchId={match.id} isAdmin={isAdmin} />
          </Card>
        )}

        {/* Lineups */}
        <Card className="border-yellow-500/30">
          <h2 className="text-2xl font-black text-yellow-400 text-center mb-6">
            LINEUPS
          </h2>

          <div className="space-y-8">
            {/* INTERNAL TEAMS: home & away */}
            {playingTeamIds.map((teamId) => {
              const { name: teamName, colorClass } = teamMap[teamId];
              const teamPlayers = groupedLineups[teamName] || [];
              return renderTeamLineup(
                teamId,
                teamName,
                colorClass,
                teamPlayers
              );
            })}

            {/* EXTERNAL TEAMS: cogni & opponent */}
            {match?.cogni_id &&
              match?.cogni_name &&
              !playingTeamIds.includes(match.cogni_id) && (
                <>
                  {(() => {
                    const cogniPlayers = lineups.filter(
                      (p) => p.team_id === match.cogni_id
                    );
                    return renderTeamLineup(
                      match.cogni_id!,
                      match.cogni_name!,
                      match.cogni_color || "#e5e7eb",
                      cogniPlayers
                    );
                  })()}
                </>
              )}

            {match?.opponent_id &&
              match?.opponent_name &&
              !playingTeamIds.includes(match.opponent_id) && (
                <>
                  {(() => {
                    const opponentPlayers = lineups.filter(
                      (p) => p.team_id === match.opponent_id
                    );
                    return renderTeamLineup(
                      match.opponent_id!,
                      match.opponent_name!,
                      match.opponent_color || "#e5e7eb",
                      opponentPlayers
                    );
                  })()}
                </>
              )}
          </div>
        </Card>

        {/* Admin: Add Players */}
        {isAdmin && (
          <Card className="border-purple-500/30">
            <h2 className="text-xl font-black text-yellow-400 mb-4 text-center">
              ADD PLAYERS TO MATCH
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* === PLAYERS SELECT === */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">
                    PLAYERS
                  </label>

                  {/* React Select - Always Open Input */}
                  <Select<PlayerOption, true>
                    options={allPlayers.map((p) => ({
                      value: p.id,
                      label: `${p.name} (${p.position})`,
                    }))}
                    isMulti
                    value={selectedPlayers}
                    onChange={(selected) => setSelectedPlayers(selected ?? [])}
                    placeholder="Type player name..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                    // Mobile UX Fixes
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    controlShouldRenderValue={false} // We show pills manually
                    // Custom styles
                    styles={{
                      // Input stays visible
                      input: (base) => ({
                        ...base,
                        color: "white",
                        minWidth: "120px",
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: "#94a3b8",
                      }),
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: "#1e293b",
                        borderColor: state.isFocused ? "#8b5cf6" : "#1e293b",
                        boxShadow: "none",
                        minHeight: "52px",
                        padding: "4px 8px",
                        cursor: "text",
                        borderRadius: "0.5rem",
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: "#1e293b",
                        marginTop: "4px",
                        borderRadius: "0.5rem",
                        overflow: "hidden",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "#334155"
                          : state.isFocused
                          ? "#334155"
                          : "#1e293b",
                        color: "white",
                        padding: "10px 12px",
                      }),
                    }}
                    // Hide default pills
                    components={{
                      MultiValue: () => null,
                    }}
                  />

                  {/* Custom Selected Pills (Below Input) */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedPlayers.map((player) => {
                      const playerData = allPlayers.find(
                        (p) => p.id === player.value
                      );
                      return (
                        <div
                          key={player.value}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600/30 text-amber-400 text-sm font-semibold border border-purple-500/50"
                        >
                          {player.label}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPlayers(
                                selectedPlayers.filter(
                                  (p) => p.value !== player.value
                                )
                              )
                            }
                            className="ml-1 text-amber-300 hover:text-red-400 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* === TEAM SELECT === */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">
                    TEAM
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) =>
                      setSelectedTeamId(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                    required
                  >
                    <option value="" disabled>
                      Select team
                    </option>
                    {playingTeamIds.map((tid) => {
                      const { name } = teamMap[tid] || {};
                      return name ? (
                        <option key={tid} value={tid}>
                          {name}
                        </option>
                      ) : null;
                    })}
                    {match?.cogni_id &&
                      match.cogni_name &&
                      !playingTeamIds.includes(match.cogni_id) && (
                        <option value={match.cogni_id}>
                          {match.cogni_name}
                        </option>
                      )}
                    {match?.opponent_id &&
                      match.opponent_name &&
                      !playingTeamIds.includes(match.opponent_id) && (
                        <option value={match.opponent_id}>
                          {match.opponent_name}
                        </option>
                      )}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-lg hover:scale-105 transition-all"
              >
                ADD PLAYERS
              </button>
            </form>
          </Card>
        )}

        {/* Back Button */}
        <div className="text-center">
          <Link
            to="/games"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold rounded-full hover:scale-105 transition-all shadow-lg"
          >
            BACK TO GAMES
          </Link>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default MatchCentre;
