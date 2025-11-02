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
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Defender":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Midfielder":
        return "bg-green-100 text-green-800 border-green-200";
      case "Forward":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            {error || "Player Not Found"}
          </h1>
          <Link
            to="/squad"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Squad</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Link
            to="/squad"
            className="inline-flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Squad</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Player Header */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="lg:flex">
              <div className="lg:w-1/3">
                <div
                  className="relative"
                  style={{ width: "100%", aspectRatio: "3/4", maxHeight: 800 }}
                >
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute top-4 right-4 bg-blue-600 text-white w-12 md:w-16 h-12 md:h-16 rounded-full flex items-center justify-center text-lg md:text-2xl font-bold">
                    {player.jerseyNumber}
                  </div>
                </div>
              </div>

              <div className="lg:w-2/3 p-4 md:p-6 lg:p-8">
                <div className="mb-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getPositionColor(
                      player.position
                    )}`}
                  >
                    {player.position}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 md:mb-6">
                  {player.name}
                </h1>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="text-slate-400" size={16} />
                    <div>
                      <div className="text-xs md:text-sm text-slate-600">
                        Age
                      </div>
                      <div className="text-sm md:text-base font-semibold text-slate-900">
                        {player.age}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="text-slate-400" size={16} />
                    <div>
                      <div className="text-xs md:text-sm text-slate-600">
                        Nationality
                      </div>
                      <div className="text-sm md:text-base font-semibold text-slate-900">
                        {player.nationality}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Ruler className="text-slate-400" size={16} />
                    <div>
                      <div className="text-xs md:text-sm text-slate-600">
                        Height
                      </div>
                      <div className="text-sm md:text-base font-semibold text-slate-900">
                        {player.height}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Weight className="text-slate-400" size={16} />
                    <div>
                      <div className="text-xs md:text-sm text-slate-600">
                        Weight
                      </div>
                      <div className="text-sm md:text-base font-semibold text-slate-900">
                        {player.weight}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="text-slate-400" size={16} />
                    <div>
                      <div className="text-xs md:text-sm text-slate-600">
                        Jersey
                      </div>
                      <div className="text-sm md:text-base font-semibold text-slate-900">
                        #{player.jerseyNumber}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Users className="text-slate-400" size={16} />
                    <div>
                      <div className="text-xs md:text-sm text-slate-600">
                        Appearances
                      </div>
                      <div className="text-sm md:text-base font-semibold text-slate-900">
                        {player.appearances}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {player.name}
            </h1>

            {/* Edit button */}
            <Link
              to={`/edit-player/${player.id}`}
              className="mt-3 md:mt-0 inline-flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 transition-colors"
            >
              <Pencil size={18} />
              <span>Edit</span>
            </Link>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Season Statistics */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 lg:p-8 mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">
                  Season Statistics
                </h2>
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                  <div className="text-center">
                    <div className="w-12 md:w-16 h-12 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                      <Target className="text-blue-600" size={20} />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                      {player.goals}
                    </div>
                    <div className="text-xs md:text-base text-slate-600">
                      Goals
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-12 md:w-16 h-12 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                      <Trophy className="text-green-600" size={20} />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                      {player.assists}
                    </div>
                    <div className="text-xs md:text-base text-slate-600">
                      Assists
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-12 md:w-16 h-12 md:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                      <Users className="text-purple-600" size={20} />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                      {player.appearances}
                    </div>
                    <div className="text-xs md:text-base text-slate-600">
                      Appearances
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Bio */}
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 lg:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">
                  About {player.name}
                </h2>
                <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                  {player.bio}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4 md:space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base text-slate-600">
                      Goals per game
                    </span>
                    <span className="text-sm md:text-base font-semibold text-slate-900">
                      {(player.goals / player.appearances).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base text-slate-600">
                      Assists per game
                    </span>
                    <span className="text-sm md:text-base font-semibold text-slate-900">
                      {(player.assists / player.appearances).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base text-slate-600">
                      Goal contributions
                    </span>
                    <span className="text-sm md:text-base font-semibold text-slate-900">
                      {player.goals + player.assists}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-4 md:p-6 text-white">
                <h3 className="text-base md:text-lg font-bold mb-4">
                  Jersey Number
                </h3>
                <div className="text-center">
                  <div className="text-4xl md:text-6xl font-bold mb-2">
                    #{player.jerseyNumber}
                  </div>
                  <div className="text-sm md:text-base text-blue-100">
                    {player.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
