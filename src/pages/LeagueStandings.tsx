import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Scorecard from "../pages/Scorecard";
import HeadToHeadTrivia from "./HeadToHeadTrivia";

type Scorer = {
  id: number;
  name: string;
  goals: number;
  appearances: number;
  position: string;
  photo?: string;
};

type Assister = {
  id: number;
  name: string;
  assists: number;
  position: string;
  photo?: string;
};

type Saver = {
  id: number;
  name: string;
  saves: number;
  position: string;
  photo?: string;
};

interface Standing {
  team_id: number;
  team_name: string;
  team_color: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export const LeagueStandings: React.FC = () => {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [topScorers, setTopScorers] = useState<Scorer[]>([]);
  const [topAssisters, setTopAssisters] = useState<Assister[]>([]);
  const [topSavers, setTopSavers] = useState<Saver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [standingsRes, scorersRes, assistersRes, saversRes] =
          await Promise.all([
            fetch("/.netlify/functions/getLeagueStandings"),
            fetch("/.netlify/functions/getLeagueTopScorers?limit=10"),
            fetch("/.netlify/functions/getLeagueTopAssists?limit=10"),
            fetch("/.netlify/functions/getLeagueTopSaves?limit=10"),
          ]);

        if (
          !standingsRes.ok ||
          !scorersRes.ok ||
          !assistersRes.ok ||
          !saversRes.ok
        )
          throw new Error("Failed to load data");

        setStandings(await standingsRes.json());
        setTopScorers(await scorersRes.json());
        setTopAssisters(await assistersRes.json());
        setTopSavers(await saversRes.json());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-3xl font-bold text-yellow-400 animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">Error: {error}</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter">
            <span className="text-yellow-400 drop-shadow-lg">LEAGUE</span>
            <span className="text-white"> STANDINGS</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Season 2025/26</p>
        </div>

        {/* TABLE — YOUR ORIGINAL WORKING SCROLL */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-yellow-600 to-amber-600 p-4">
            <h2 className="text-xl font-bold text-slate-900">Current Table</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full">
              <thead>
                <tr className="text-xs font-semibold text-gray-400 border-b border-slate-700">
                  <th className="py-3 px-6 text-center">POS</th>
                  <th className="py-3 px-6 text-left">TEAM</th>
                  <th className="py-3 px-6 text-center">PTS</th>
                  <th className="py-3 px-6 text-center">P</th>
                  <th className="py-3 px-6 text-center">W</th>
                  <th className="py-3 px-6 text-center">D</th>
                  <th className="py-3 px-6 text-center">L</th>
                  <th className="py-3 px-6 text-center">GF</th>
                  <th className="py-3 px-6 text-center">GA</th>
                  <th className="py-3 px-6 text-center">GD</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => (
                  <tr
                    key={team.team_id}
                    className="border-b border-slate-700 hover:bg-slate-700/50 transition-all"
                  >
                    <td className="py-3 px-6 text-center font-bold text-lg">
                      {index + 1}
                    </td>
                    <td className="py-3 px-6 flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full shadow-md"
                        style={{ backgroundColor: team.team_color || "#666" }}
                      />
                      <span className="font-semibold text-sm truncate">
                        {team.team_name.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center text-2xl font-black text-yellow-400">
                      {team.points}
                    </td>
                    <td className="py-3 px-6 text-center">{team.played}</td>
                    <td className="py-3 px-6 text-center text-green-400">
                      {team.wins}
                    </td>
                    <td className="py-3 px-6 text-center text-gray-400">
                      {team.draws}
                    </td>
                    <td className="py-3 px-6 text-center text-red-400">
                      {team.losses}
                    </td>
                    <td className="py-3 px-6 text-center">{team.goals_for}</td>
                    <td className="py-3 px-6 text-center">
                      {team.goals_against}
                    </td>
                    <td className="py-3 px-6 text-center font-medium">
                      {team.goal_difference > 0 ? "+" : ""}
                      {team.goal_difference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP SCORERS — VISIBLE */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 shadow-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">
            GOLDEN BOOT ⚽
          </h3>
          <div className="space-y-3">
            {topScorers.map((player, idx) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  idx === 0
                    ? "bg-gradient-to-r from-yellow-600 to-amber-600 text-slate-900 shadow-xl"
                    : "bg-slate-700/50 hover:bg-slate-600/50"
                }`}
              >
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/50">
                    {player.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">
                    {player.name.toUpperCase()}
                  </p>
                  <p className="text-xs opacity-70">{player.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">{player.goals}</p>
                  <p className="text-xs opacity-70">
                    {player.appearances} apps
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GOLDEN PLAYMAKER — MOST ASSISTS */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 shadow-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">
            GOLDEN PLAYMAKER 🅰️
          </h3>
          <div className="space-y-3">
            {topAssisters.map((player, idx) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  idx === 0
                    ? "bg-gradient-to-r from-yellow-600 to-amber-600 text-slate-900 shadow-xl"
                    : "bg-slate-700/50 hover:bg-slate-600/50"
                }`}
              >
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/50">
                    {player.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">
                    {player.name.toUpperCase()}
                  </p>
                  <p className="text-xs opacity-70">{player.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">{player.assists}</p>
                  <p className="text-xs opacity-70">assists</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GOLDEN GLOVE — MOST SAVES */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 shadow-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">
            GOLDEN GLOVE 🧤
          </h3>
          <div className="space-y-3">
            {topSavers.map((player, idx) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  idx === 0
                    ? "bg-gradient-to-r from-yellow-600 to-amber-600 text-slate-900 shadow-xl"
                    : "bg-slate-700/50 hover:bg-slate-600/50"
                }`}
              >
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/50">
                    {player.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">
                    {player.name.toUpperCase()}
                  </p>
                  <p className="text-xs opacity-70">{player.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">{player.saves}</p>
                  <p className="text-xs opacity-70">saves</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR COMPONENTS */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-4 shadow-xl">
            <Scorecard />
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-4 shadow-xl">
            <HeadToHeadTrivia />
          </div>
        </div>

        {/* BACK BUTTON */}
        <div className="text-center mt-12">
          <Link
            to="/games"
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-slate-900 font-bold rounded-full hover:bg-yellow-400 hover:scale-105 transition-all shadow-lg"
          >
            ← BACK TO GAMES
          </Link>
        </div>
      </div>
    </div>
  );
};
