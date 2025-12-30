import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Target,
  Trophy,
  Users,
  Calendar,
  MapPin,
  User,
  Ruler,
  Weight,
  Pencil,
} from "lucide-react";
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

const PlayerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const API_URL =
      process.env.NODE_ENV === "development"
        ? `https://feature-vs-new--cognihfxfc.netlify.app/.netlify/functions/getPlayerById?id=${id}`
        : `/.netlify/functions/getPlayerById?id=${id}`;

    const fetchPlayer = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Failed to fetch player #${id}`);
        const data: Player = await res.json();
        setPlayer(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [id]);

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
            LOADING PLAYER...
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (error || !player) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-black text-red-400">
              {error || "PLAYER NOT FOUND"}
            </h1>
            <Link
              to="/squad"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-full hover:scale-105 transition-all shadow-lg"
            >
              <ArrowLeft size={20} />
              BACK TO SQUAD
            </Link>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Back Button */}
        <Link
          to="/squad"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          BACK TO SQUAD
        </Link>

        {/* Player Header Card */}
        <Card className="border-yellow-500/30 overflow-hidden">
          <div className="lg:flex">
            {/* Photo */}
            <div className="lg:w-1/3">
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-full h-full object-cover object-top"
                />
                {/* Jersey Number */}
                <div className="absolute top-6 right-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shadow-xl">
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
            </div>

            {/* Info */}
            <div className="lg:w-2/3 p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-6">
                <Title>{player.name}</Title>
              </h1>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="text-yellow-400" size={20} />
                  <div>
                    <div className="text-gray-400">Age</div>
                    <div className="font-bold text-white">{player.age}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="text-yellow-400" size={20} />
                  <div>
                    <div className="text-gray-400">Nationality</div>
                    <div className="font-bold text-white">
                      {player.nationality}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Ruler className="text-yellow-400" size={20} />
                  <div>
                    <div className="text-gray-400">Height</div>
                    <div className="font-bold text-white">{player.height}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Weight className="text-yellow-400" size={20} />
                  <div>
                    <div className="text-gray-400">Weight</div>
                    <div className="font-bold text-white">{player.weight}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="text-yellow-400" size={20} />
                  <div>
                    <div className="text-gray-400">Jersey</div>
                    <div className="font-bold text-white">
                      #{player.jerseyNumber}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="text-yellow-400" size={20} />
                  <div>
                    <div className="text-gray-400">Appearances</div>
                    <div className="font-bold text-white">
                      {player.appearances}
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-8">
                <Link
                  to={`/edit-player/${player.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-full hover:scale-105 transition-all shadow-lg"
                >
                  <Pencil size={18} />
                  EDIT PLAYER
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats + Bio + Quick Stats */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Season Statistics */}
          <div className="lg:col-span-2">
            <Card className="border-yellow-500/30">
              <div className="p-6 md:p-8">
                <h2 className="text-2xl font-black text-yellow-400 mb-6 text-center">
                  SEASON STATISTICS
                </h2>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Target className="text-blue-400" size={32} />
                    </div>
                    <div className="text-4xl font-black text-white">
                      {player.position === "Goalkeeper"
                        ? player.saves
                        : player.goals}
                    </div>
                    <div className="text-sm text-gray-400">
                      {player.position === "Goalkeeper" ? "Saves" : "Goals"}
                    </div>
                  </div>
                  <div>
                    <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Trophy className="text-green-400" size={32} />
                    </div>
                    <div className="text-4xl font-black text-white">
                      {player.assists}
                    </div>
                    <div className="text-sm text-gray-400">Assists</div>
                  </div>
                  <div>
                    <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="text-purple-400" size={32} />
                    </div>
                    <div className="text-4xl font-black text-white">
                      {player.appearances}
                    </div>
                    <div className="text-sm text-gray-400">Appearances</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card className="border-blue-500/30">
              <div className="p-6">
                <h3 className="text-lg font-black text-white mb-4">
                  QUICK STATS
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Goals per game</span>
                    <span className="font-bold text-white">
                      {(player.goals / player.appearances || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Assists per game</span>
                    <span className="font-bold text-white">
                      {(player.assists / player.appearances || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Goal contributions</span>
                    <span className="font-bold text-white">
                      {player.goals + player.assists}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Jersey Card */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
              <div className="p-6 text-center">
                <h3 className="text-lg font-black mb-4">JERSEY NUMBER</h3>
                <div className="text-6xl md:text-7xl font-black mb-2">
                  #{player.jerseyNumber}
                </div>
                <div className="text-sm opacity-90">{player.name}</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bio */}
        <Card className="border-yellow-500/30">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-black text-yellow-400 mb-4">
              ABOUT {player.name.toUpperCase()}
            </h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              {player.bio}
            </p>
          </div>
        </Card>
      </div>
    </ThemeProvider>
  );
};

export default PlayerDetail;
