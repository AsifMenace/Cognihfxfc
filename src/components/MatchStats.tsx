import React, { useEffect, useState } from "react";

interface MatchStat {
  id: number;
  name: string;
  jerseyNumber: number;
  position: string;
  assists: number;
  saves: number;
}

interface MatchStatsProps {
  matchId: number;
}

export const MatchStats: React.FC<MatchStatsProps> = ({ matchId }) => {
  const [stats, setStats] = useState<MatchStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMatchStats();
  }, [matchId]);

  const fetchMatchStats = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/.netlify/functions/getMatchStats?matchId=${matchId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch match stats");
      }

      const data = await response.json();
      setStats(data || []);
    } catch (err) {
      setError("No stats available for this match");
      console.error("Match stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl font-black text-yellow-400 animate-pulse tracking-wider">
          LOADING STATS...
        </div>
      </div>
    );
  }

  if (error || stats.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 font-medium text-lg italic">
        No match statistics available
      </div>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-b from-gray-900/50 to-black/50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent mb-4 tracking-tight">
            MATCH STATISTICS
          </h2>
          <div className="flex justify-center gap-8 text-2xl font-bold text-gray-300 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🅰️</span>
              </div>
              <span>ASSISTS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🧤</span>
              </div>
              <span>SAVES</span>
            </div>
          </div>
        </div>
        {/* Stats Grid */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ASSISTS SECTION */}
          {stats.filter((s) => s.assists > 0).length > 0 && (
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-2xl p-6 hover:shadow-blue-500/25 transition-all duration-300">
              <h4 className="text-xl sm:text-2xl font-black text-white mb-2 text-center flex items-center justify-center gap-2">
                🅰️ ASSISTS
              </h4>
              <div className="space-y-3">
                {stats
                  .filter((s) => s.assists > 0)
                  .sort((a, b) => b.assists - a.assists)
                  .map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-200"
                    >
                      <span className="font-bold text-white truncate">
                        {player.name}
                      </span>
                      <span className="text-2xl font-black text-blue-400">
                        {player.assists}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SAVES SECTION */}
          {stats.filter((s) => s.saves > 0).length > 0 && (
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-2xl p-6 hover:shadow-green-500/25 transition-all duration-300">
              <h4 className="text-xl sm:text-2xl font-black text-white mb-2 text-center flex items-center justify-center gap-2">
                🧤 SAVES
              </h4>
              <div className="space-y-3">
                {stats
                  .filter((s) => s.saves > 0)
                  .sort((a, b) => b.saves - a.saves)
                  .map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-200"
                    >
                      <span className="font-bold text-white truncate">
                        {player.name}
                      </span>
                      <span className="text-2xl font-black text-green-400">
                        {player.saves}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Custom scrollbar for stats */
        .stats-container::-webkit-scrollbar {
          width: 8px;
        }
        .stats-container::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 10px;
        }
        .stats-container::-webkit-scrollbar-thumb {
          background: #eab308;
          border-radius: 10px;
          border: 2px solid #1a1a1a;
        }
      `}</style>
    </section>
  );
};
