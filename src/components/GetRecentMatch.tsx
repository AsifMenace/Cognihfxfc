import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFutbol } from "@fortawesome/free-solid-svg-icons";

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

const SoccerBallIcon = () => (
  <FontAwesomeIcon icon={faFutbol} className="mr-1 text-white" />
);

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

  const [homeScore, awayScore] = match.result.split("-").map((s) => s.trim());

  return (
    <div className="max-w-md mx-auto rounded shadow p-6 bg-blue-900  text-white font-sans">
      <div className="text-center text-xs uppercase tracking-widest mb-3 opacity-80">
        Last Match {match.competition && `• ${match.competition}`}
      </div>

      <div className="flex items-center justify-between mb-6 px-4">
        <div
          className="rounded-xl shadow-md px-2 py-2 font-semibold max-w-[45%] text-center "
          style={{ backgroundColor: match.home_team_color }}
          title={match.home_team_name}
        >
          {match.home_team_name}
        </div>

        <div className="text-4xl font-extrabold px-6 text-white-800 select-none">
          {homeScore}
        </div>

        <span className="text-4xl font-bold text-white-600 select-none">-</span>

        <div className="text-4xl font-extrabold px-6 text-white-800 select-none">
          {awayScore}
        </div>

        <div
          className="rounded-xl shadow-md px-2 py-2 font-semibold max-w-[45%] text-center "
          style={{ backgroundColor: match.away_team_color }}
          title={match.away_team_name}
        >
          {match.away_team_name}
        </div>
      </div>

      <div className="flex justify-between px-4 space-x-4 text-sm select-none">
        <div className="w-1/2">
          {homeGoals.length > 0 ? (
            homeGoals.map((goal) => (
              <div key={goal.id} className="truncate" title={goal.player_name}>
                <SoccerBallIcon />
                {goal.player_name}
              </div>
            ))
          ) : (
            <div className="italic text-blue-300">None</div>
          )}
        </div>

        <div className="w-1/2 text-right">
          {awayGoals.length > 0 ? (
            awayGoals.map((goal) => (
              <div key={goal.id} className="truncate" title={goal.player_name}>
                <SoccerBallIcon />
                {goal.player_name}
              </div>
            ))
          ) : (
            <div className="italic text-blue-300">None</div>
          )}
        </div>
      </div>
    </div>
  );
};
