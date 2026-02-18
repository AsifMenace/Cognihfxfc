import React, { useEffect, useState } from "react";

type HeadToHeadResult = {
  team1: string;
  team2: string;
  total_matches: number;
  team1_wins: number;
  team2_wins: number;
  draws: number;
};

export default function HeadToHeadTrivia() {
  const [h2hResults, setH2hResults] = useState<HeadToHeadResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchH2H = async () => {
      try {
        setLoading(true);
        const res = await fetch("/.netlify/functions/getHeadToHeadResults");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP error: ${res.status}`);
        }
        const data = await res.json();
        setH2hResults(data);
        setError(null);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load head to head results",
        );
        setH2hResults([]);
      } finally {
        setLoading(false);
      }
    };
    fetchH2H();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-6 shadow-xl">
        <div className="text-center text-yellow-400 animate-pulse font-bold">
          LOADING TRIVIA...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 backdrop-blur-sm rounded-2xl border border-red-500/50 p-6 shadow-xl">
        <p className="text-red-400 text-center font-bold">ERROR: {error}</p>
      </div>
    );
  }

  if (h2hResults.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-6 shadow-xl">
        <p className="text-gray-400 text-center">
          No head-to-head data available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 shadow-2xl p-4 sm:p-6 w-full sm:w-auto max-w-full sm:max-w-xs overflow-x-auto">
      <h2 className="text-xl font-black text-yellow-400 mb-5 tracking-wider text-center flex items-center justify-center gap-2">
        HEAD-TO-HEAD TRIVIA
      </h2>

      <div className="space-y-5">
        {h2hResults.map(
          (
            { team1, team2, total_matches, team1_wins, team2_wins, draws },
            i,
          ) => (
            <div
              key={i}
              className="bg-slate-700/50 rounded-lg p-4 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-slate-600"
            >
              {/* TEAMS */}
              <div className="text-center font-bold text-sm text-yellow-300 mb-3">
                {team1.toUpperCase()} <span className="text-gray-500">vs</span>{" "}
                {team2.toUpperCase()}
              </div>

              {/* STATS GRID */}
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
                <div className="text-center">
                  <div className="text-2xl font-black text-white">
                    {total_matches}
                  </div>
                  <div className="text-xs text-gray-500">MATCHES</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-400">
                    {team1_wins}
                  </div>
                  <div className="text-xs text-gray-500">{team1} WINS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-red-400">
                    {team2_wins}
                  </div>
                  <div className="text-xs text-gray-500">{team2} WINS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-400">
                    {draws}
                  </div>
                  <div className="text-xs text-gray-500">DRAWS</div>
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
