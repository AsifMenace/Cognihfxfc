import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target, Users, Trophy } from "lucide-react";

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
        ? "https://db-integration--cognihfxfc.netlify.app/.netlify/functions/getPlayers"
        : "/.netlify/functions/getPlayers";
    // const API_URL = 'https://db-integration--c  ognihfxfc.netlify.app/.netlify/functions/getPlayers';

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
        return "bg-yellow-100 text-yellow-800";
      case "Defender":
        return "bg-blue-100 text-blue-800";
      case "Midfielder":
        return "bg-green-100 text-green-800";
      case "Forward":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading players...</div>;
  }
  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            First Team Squad
          </h1>
          <p className="text-lg md:text-xl text-slate-600 px-4">
            Meet our talented core players who make Cogni Hfx FC special
          </p>
        </div>

        {/* Squad Statistics */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-center text-slate-900 mb-4 md:mb-6">
              Squad Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
              <div>
                <div className="w-12 md:w-16 h-12 md:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <Users className="text-white" size={20} />
                </div>
                <div className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                  {players.length}
                </div>
                <div className="text-xs md:text-base text-slate-600">
                  Total Players
                </div>
              </div>
              <div>
                <div className="w-12 md:w-16 h-12 md:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <Target className="text-white" size={20} />
                </div>
                <div className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                  {players.reduce((total, player) => total + player.goals, 0)}
                </div>
                <div className="text-xs md:text-base text-slate-600">
                  Goals Scored
                </div>
              </div>
              <div>
                <div className="w-12 md:w-16 h-12 md:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <Trophy className="text-white" size={20} />
                </div>
                <div className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                  {players.reduce((total, player) => total + player.assists, 0)}
                </div>
                <div className="text-xs md:text-base text-slate-600">
                  Assists
                </div>
              </div>
              <div>
                <div className="w-12 md:w-16 h-12 md:h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <Users className="text-white" size={20} />
                </div>
                <div className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                  {Math.round(
                    players.reduce((total, player) => total + player.age, 0) /
                      players.length
                  )}
                </div>
                <div className="text-xs md:text-base text-slate-600">
                  Average Age
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Players by Position */}
        <div className="space-y-12">
          {positionOrder.map((position) => {
            const positionPlayers = groupedPlayers[position] || [];
            if (positionPlayers.length === 0) return null;
            return (
              <div key={position} className="max-w-6xl mx-auto">
                <div className="flex items-center justify-center mb-8">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mr-4">
                    {position}s
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getPositionColor(
                      position
                    )}`}
                  >
                    {positionPlayers.length} Player
                    {positionPlayers.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {positionPlayers.map((player) => (
                    <Link
                      key={player.id}
                      to={`/player/${player.id}`}
                      className="group"
                    >
                      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 overflow-hidden">
                        <div className="relative">
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="w-full h-40 md:h-48 object-cover object-top"
                          />
                          <div className="absolute top-2 md:top-4 right-2 md:right-4 bg-blue-600 text-white w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold">
                            {player.jerseyNumber}
                          </div>
                          <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(
                                player.position
                              )}`}
                            >
                              {player.position}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 md:p-6">
                          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-1">
                            {player.name}
                          </h3>
                          <p className="text-slate-600 text-sm mb-4">
                            {player.nationality} • Age {player.age}
                          </p>

                          <div className="grid grid-cols-3 gap-2 md:gap-4 text-center text-xs md:text-sm">
                            <div>
                              <div className="font-bold text-slate-900">
                                {player.goals}
                              </div>
                              <div className="text-slate-500">Goals</div>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">
                                {player.assists}
                              </div>
                              <div className="text-slate-500">Assists</div>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">
                                {player.appearances}
                              </div>
                              <div className="text-slate-500">Apps</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Squad;
