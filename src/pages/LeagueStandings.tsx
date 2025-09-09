import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStandings() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/.netlify/functions/getLeagueStandings");
        if (!res.ok)
          throw new Error(`Error fetching standings: ${res.statusText}`);
        const data = await res.json();
        setStandings(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchStandings();
  }, []);

  const [topScorers, setTopScorers] = useState<Scorer[]>([]);

  useEffect(() => {
    fetch("/.netlify/functions/getTopScorers?limit=20")
      .then((res) => res.json())
      .then((data) => setTopScorers(data));
  }, []);

  if (loading) return <p>Loading league standings...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="overflow-auto max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl uppercase font-bold mb-4 text-center">
        League Standings
      </h2>
      <table className="min-w-full bg-white border rounded shadow">
        <thead>
          <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
            <th className="py-3 px-6 text-center">Pos</th>{" "}
            {/* New position column */}
            <th className="py-3 px-6 text-left">Team</th>
            <th className="py-3 px-6 text-center">Pts</th>
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
              className="text-gray-600 uppercase hover:bg-gray-50"
            >
              <td className="py-3 px-6 text-center font-bold">{index + 1}</td>{" "}
              {/* Position */}
              <td className="py-3 px-6 flex items-center space-x-3">
                <span
                  className="inline-block w-4 h-4 rounded-full"
                  style={{ backgroundColor: team.team_color || "#888" }}
                />
                <span>{team.team_name}</span>
              </td>
              <td className="py-3 px-6 text-center font-bold">{team.points}</td>
              <td className="py-3 px-6 text-center">{team.played}</td>
              <td className="py-3 px-6 text-center">{team.wins}</td>
              <td className="py-3 px-6 text-center">{team.draws}</td>
              <td className="py-3 px-6 text-center">{team.losses}</td>
              <td className="py-3 px-6 text-center">{team.goals_for}</td>
              <td className="py-3 px-6 text-center">{team.goals_against}</td>
              <td className="py-3 px-6 text-center">{team.goal_difference}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8  bg-white rounded shadow p-4">
        <h3 className="text-lg font-bold mb-2">Top Scorers</h3>
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <ul className="divide-y divide-gray-200">
            {topScorers.map((player, idx) => (
              <li
                key={player.id}
                className={`flex items-center py-2 space-x-3 rounded px-3 transition-shadow cursor-pointer ${
                  idx === 0
                    ? "bg-yellow-100 border border-yellow-400 shadow-lg font-semibold"
                    : "bg-white hover:shadow-md"
                }`}
              >
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-8 h-8 rounded-full object-cover object-top"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                    {player.name[0]}
                  </div>
                )}
                <span className="font-bold">{idx + 1}.</span>
                <span className="flex-1 uppercase">{player.name}</span>
                <span className="flex items-center text-sm text-gray-500">
                  {idx === 0 && (
                    <span
                      className="text-yellow-500 mr-1"
                      role="img"
                      aria-label="trophy"
                    >
                      🏆
                    </span>
                  )}
                  {player.position}
                </span>
                <span className="font-semibold">{player.goals} goals</span>
                <span className="text-xs text-gray-400 ml-2">
                  ({player.appearances} apps)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center mt-8 flex gap-6 justify-center overflow-x-auto">
        <aside className="min-w-[320px] max-w-[340px] flex-shrink-0">
          <Scorecard />
        </aside>
        <aside className="min-w-[320px] max-w-[340px] flex-shrink-0">
          <HeadToHeadTrivia />
        </aside>
      </div>

      {/* Back link */}
      <div className="text-center mt-8">
        <Link
          to="/games"
          className="inline-block px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition"
        >
          ← Back to Games
        </Link>
      </div>
    </div>
  );
};
