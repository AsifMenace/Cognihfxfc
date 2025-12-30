import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target, Users, Trophy } from "lucide-react";
import ThemeProvider from "../components/ThemeProvider";
import Card from "../components/Card";
import Title from "../components/Title";

interface Player {
  id: number;
  name: string;
  position: string;
  age: number;
  nationality: string;
  jerseyNumber: number;
  height: string;
  weight: string;
  goals: number;
  assists: number;
  saves: number;
  appearances: number;
  photo: string;
  bio: string;
}

type SquadProps = {
  isAdmin: boolean;
};

const Squad: React.FC<SquadProps> = ({ isAdmin }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const positionOrder = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

  useEffect(() => {
    const API_URL =
      process.env.NODE_ENV === "development"
        ? "/.netlify/functions/getPlayers?sortBy=appearances&order=DESC"
        : "/.netlify/functions/getPlayers?sortBy=appearances&order=DESC";

    const fetchPlayers = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to fetch players");
        const data: Player[] = await res.json();
        setPlayers(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  const groupedPlayers = players.reduce((acc, player) => {
    if (!acc[player.position]) {
      acc[player.position] = [];
    }
    acc[player.position].push(player);
    return acc;
  }, {} as Record<string, Player[]>);

  const getPositionColor = (position: string) => {
    switch (position) {
      case "Goalkeeper":
        return "bg-yellow-600/20 text-yellow-400 border border-yellow-600/40";
      case "Defender":
        return "bg-blue-600/20 text-blue-400 border border-blue-600/40";
      case "Midfielder":
        return "bg-green-600/20 text-green-400 border border-green-600/40";
      case "Forward":
        return "bg-red-600/20 text-red-400 border border-red-600/40";
      default:
        return "bg-gray-600/20 text-gray-400 border border-gray-600/40";
    }
  };

  if (loading) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center py-32">
          <div className="text-3xl font-black text-yellow-400 animate-pulse">
            LOADING SQUAD...
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

  return (
    <ThemeProvider>
      <div className="max-w-7xl mx-auto space-y-12 px-4 py-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-black text-yellow-400 mb-4">
            <Title>FIRST TEAM SQUAD</Title>
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Meet our talented and amazing players who make Cogni HFX FC special
          </p>
        </div>

        {/* Squad Statistics */}
        <Card className="border-yellow-500/30">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-black text-center text-yellow-400 mb-8">
              SQUAD STATISTICS
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="text-white" size={28} />
                </div>
                <div className="text-3xl font-black text-white">
                  {players.length}
                </div>
                <div className="text-sm text-gray-400">Total Players</div>
              </div>
              <div>
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="text-white" size={28} />
                </div>
                <div className="text-3xl font-black text-white">
                  {players.reduce((t, p) => t + p.goals, 0)}
                </div>
                <div className="text-sm text-gray-400">Goals Scored</div>
              </div>
              <div>
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="text-white" size={28} />
                </div>
                <div className="text-3xl font-black text-white">
                  {players.reduce((t, p) => t + p.assists, 0)}
                </div>
                <div className="text-sm text-gray-400">Assists</div>
              </div>
              <div>
                <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="text-white" size={28} />
                </div>
                <div className="text-3xl font-black text-white">
                  {players.length > 0
                    ? Math.round(
                        players.reduce((t, p) => t + p.age, 0) / players.length
                      )
                    : 0}
                </div>
                <div className="text-sm text-gray-400">Average Age</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Players by Position */}
        <div className="space-y-16">
          {positionOrder.map((position) => {
            const positionPlayers = groupedPlayers[position] || [];
            if (positionPlayers.length === 0) return null;

            return (
              <div key={position}>
                <div className="flex items-center justify-center gap-4 mb-8">
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    {position.toUpperCase()}S
                  </h2>
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-bold ${getPositionColor(
                      position
                    )}`}
                  >
                    {positionPlayers.length} Player
                    {positionPlayers.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="flex gap-6">
                    {positionPlayers.map((player) => (
                      <Link
                        key={player.id}
                        to={`/player/${player.id}`}
                        className="group flex-shrink-0 w-72 md:w-80"
                      >
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border border-slate-700">
                          {/* Photo */}
                          <div className="relative aspect-[3/4] overflow-hidden">
                            <img
                              src={player.photo}
                              alt={player.name}
                              className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                            />
                            {/* Jersey Number */}
                            <div className="absolute top-4 right-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shadow-lg">
                              {player.jerseyNumber}
                            </div>
                            {/* Position Badge — Creative & Bold */}
                            <div className="absolute bottom-6 left-6">
                              <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 blur-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
                                <span
                                  className={`relative px-5 py-2 rounded-full text-sm font-black tracking-wider uppercase shadow-2xl ${getPositionColor(
                                    player.position
                                  )}`}
                                  style={{
                                    background:
                                      "linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6))",
                                    border: `2px solid`,
                                    borderImage: `linear-gradient(135deg, ${
                                      getPositionColor(player.position).match(
                                        /bg-([a-z]+)-/
                                      )?.[1] || "yellow"
                                    }-400, ${
                                      getPositionColor(player.position).match(
                                        /bg-([a-z]+)-/
                                      )?.[1] || "amber"
                                    }-600) 1`,
                                    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                                  }}
                                >
                                  {player.position}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Player Info */}
                          <div className="p-5">
                            <h3 className="text-lg font-black text-white mb-1">
                              {player.name}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                              {player.nationality} • Age {player.age}
                            </p>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-black text-white">
                                  {player.position === "Goalkeeper"
                                    ? player.saves
                                    : player.goals}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {player.position === "Goalkeeper"
                                    ? "Saves"
                                    : "Goals"}
                                </div>
                              </div>
                              <div>
                                <div className="text-2xl font-black text-white">
                                  {player.assists}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Assists
                                </div>
                              </div>
                              <div>
                                <div className="text-2xl font-black text-white">
                                  {player.appearances}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Apps
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Squad;
