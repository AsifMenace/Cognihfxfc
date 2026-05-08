import React, { useEffect, useState } from "react";
import { TeamBadge } from "./TeamBadge";

type Match = {
  id: number;
  home_team_name: string;
  home_team_color: string;
  away_team_name: string;
  away_team_color: string;
  result: string;
  date: string;
  competition?: string;
};

type Goal = {
  player_name: string;
  team_name: string;
  team_id: number;
  id: number;
};


function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const GetRecentMatch: React.FC = () => {
  const [match, setMatch] = useState<Match | null>(null);
  const [homeGoals, setHomeGoals] = useState<Goal[]>([]);
  const [awayGoals, setAwayGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/.netlify/functions/getMatches")
      .then((res) => res.json())
      .then((matches) => {
        if (!Array.isArray(matches) || matches.length === 0) {
          setLoading(false);
          return;
        }

        // Only keep matches with a non-empty result (past matches)
        const playedMatches = matches.filter(
          (m) => m.result && m.result.trim() !== ""
        );

        if (playedMatches.length === 0) {
          setLoading(false);
          return;
        }

        // Pick the most recent played match as first element abc
        const lastMatch = playedMatches[0];
        setMatch(lastMatch);

        fetch(`/.netlify/functions/getMatchGoals?matchId=${lastMatch.id}`)
          .then((res) => res.json())
          .then((goalsData) => {
            setHomeGoals(
              goalsData.filter(
                (g: Goal) => g.team_name === lastMatch.home_team_name
              )
            );
            setAwayGoals(
              goalsData.filter(
                (g: Goal) => g.team_name === lastMatch.away_team_name
              )
            );
            setLoading(false);
          })
          .catch(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center p-4 text-white">Loading last match...</div>
    );
  }

  if (!match) {
    return (
      <div className="text-center p-4 text-white">No recent match found.</div>
    );
  }

  const [homeScoreStr, awayScoreStr] = match.result.split("-").map((s) => s.trim());
  const homeScore = Number(homeScoreStr);
  const awayScore = Number(awayScoreStr);
  const isDraw = homeScore === awayScore;
  const homeWon = homeScore > awayScore;

  const homeScoreColor = isDraw ? "text-yellow-400" : homeWon ? "text-green-400" : "text-red-400";
  const awayScoreColor = isDraw ? "text-yellow-400" : !homeWon ? "text-green-400" : "text-red-400";

  return (
    <div className="max-w-md mx-auto rounded-2xl shadow-2xl p-6 bg-gradient-to-br from-slate-900 via-blue-900/80 to-slate-900/50 backdrop-blur-xl border border-blue-500/30 text-white overflow-hidden hover:shadow-blue-500/25 transition-all duration-500">
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b border-blue-500/20">
        <div className="text-xs uppercase tracking-widest mb-2 bg-blue-500/20 px-3 py-1 rounded-full inline-block font-bold">
          LAST MATCH
          {match.competition && (
            <span className="ml-2 text-blue-300">• {match.competition}</span>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center justify-between mb-8 px-2">
        {/* Home Team */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <TeamBadge color={match.home_team_color} name={match.home_team_name} size={36} />
          <p className="text-xs font-bold text-white text-center truncate w-full">
            {match.home_team_name}
          </p>
        </div>

        {/* Score */}
        <div className="flex items-baseline gap-2 px-3 select-none">
          <span className={`text-4xl lg:text-5xl font-black ${homeScoreColor}`}>
            {homeScore}
          </span>
          <span className="text-3xl font-bold text-gray-500">—</span>
          <span className={`text-4xl lg:text-5xl font-black ${awayScoreColor}`}>
            {awayScore}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <TeamBadge color={match.away_team_color} name={match.away_team_name} size={36} />
          <p className="text-xs font-bold text-white text-center truncate w-full">
            {match.away_team_name}
          </p>
        </div>
      </div>

      {/* Scorers - Side by Side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Home Scorers */}
        <div>
          <h4 className="text-xs uppercase font-bold text-blue-400 mb-4 tracking-wider flex items-center gap-1">
            <span className="text-sm">🎯</span> SCORERS
          </h4>
          <div className="space-y-2">
            {homeGoals.length > 0 ? (
              homeGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-200 group"
                >
                  <span className="text-yellow-400 text-lg group-hover:scale-110 transition-transform">
                    ⚽
                  </span>
                  <span className="font-bold text-white truncate text-sm">
                    {goal.player_name}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-20 flex items-center justify-center">
                <span className="italic text-gray-400 text-sm font-medium">
                  No goals
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Away Scorers */}
        <div>
          <h4 className="text-xs uppercase font-bold text-purple-400 mb-4 tracking-wider flex items-center gap-1 justify-end">
            SCORERS <span className="text-sm">🎯</span>
          </h4>
          <div className="space-y-2">
            {awayGoals.length > 0 ? (
              awayGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-200 group justify-end"
                >
                  <span className="font-bold text-white truncate text-sm">
                    {goal.player_name}
                  </span>
                  <span className="text-purple-400 text-lg group-hover:scale-110 transition-transform">
                    ⚽
                  </span>
                </div>
              ))
            ) : (
              <div className="h-20 flex items-center justify-center">
                <span className="italic text-gray-400 text-sm font-medium">
                  No goals
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
