import React, { useEffect, useState } from "react";
import { FaTrophy } from "react-icons/fa";

type MatchResult = {
  home_team_name: string;
  home_team_color: string;
  away_team_name: string;
  away_team_color: string;
  result: string;
  date: string;
  competition: string;
};

type GroupedResults = {
  [dayLabel: string]: MatchResult[];
};

export default function Scorecard() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedResults>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await fetch("/.netlify/functions/getMatchResultsByDay");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP error: ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format received from backend");
        }
        setResults(data);

        const uniqueDates = Array.from(
          new Set(data.map((m) => m.date.split("T")[0])),
        ).sort();
        const dateToDayNumber: Record<string, number> = {};
        uniqueDates.forEach((date, i) => {
          dateToDayNumber[date] = i + 1;
        });

        const grouped: GroupedResults = {};
        data.forEach((match) => {
          const matchDay = match.date.split("T")[0];
          const dayNumber = dateToDayNumber[matchDay];
          const dayLabel = `Day ${dayNumber}`;
          if (!grouped[dayLabel]) grouped[dayLabel] = [];
          grouped[dayLabel].push(match);
        });
        setGroupedResults(grouped);
        setError(null);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-6 shadow-xl">
        <div className="text-center text-yellow-400 animate-pulse font-bold">
          LOADING SCORECARD...
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

  if (results.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-6 shadow-xl">
        <p className="text-gray-400 text-center">No match results available.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 shadow-2xl p-4 sm:p-6 w-full sm:w-auto max-w-full sm:max-w-xs overflow-x-auto">
      <h3 className="text-xl font-black text-yellow-400 mb-5 justify-center tracking-wider flex items-center gap-2">
        <FaTrophy className="text-yellow-500" />
        MATCH RESULTS
      </h3>

      {/* HORIZONTAL SCROLL ON MOBILE, VERTICAL ON DESKTOP */}
      <div className="flex flex-row gap-6 overflow-x-auto flex-nowrap sm:flex-col sm:gap-0 sm:overflow-x-visible pb-2 sm:pb-0">
        {Object.entries(groupedResults)
          .sort(([a], [b]) => {
            const numA = parseInt(a.split(" ")[1], 10);
            const numB = parseInt(b.split(" ")[1], 10);
            return numB - numA;
          })
          .map(([dayLabel, matches]) => (
            <div
              key={dayLabel}
              className="min-w-[280px] max-w-[320px] flex-shrink-0 sm:min-w-0 sm:max-w-full sm:mb-6"
            >
              {/* DAY HEADER */}
              <div className="mb-4 pb-2 border-b-2 border-yellow-500">
                <h4 className="text-lg font-extrabold tracking-wider text-yellow-400">
                  {dayLabel}
                </h4>
              </div>

              {/* MATCHES */}
              <div className="space-y-3">
                {matches.map(
                  (
                    {
                      home_team_name,
                      away_team_name,
                      result,
                      home_team_color,
                      away_team_color,
                    }: MatchResult,
                    i,
                  ) => {
                    const [homeScoreStr, awayScoreStr] = result.split("-");
                    const homeScore = parseInt(homeScoreStr, 10);
                    const awayScore = parseInt(awayScoreStr, 10);
                    const homeIsWinner = homeScore > awayScore;
                    const awayIsWinner = awayScore > homeScore;

                    return (
                      <div
                        key={i}
                        className="bg-slate-700/50 rounded-lg p-3 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-slate-600"
                      >
                        {/* HOME TEAM */}
                        <div
                          className={`flex items-center justify-between ${
                            homeIsWinner ? "bg-yellow-600/20 rounded px-1" : ""
                          }`}
                        >
                          <div
                            className="font-bold text-sm flex items-center gap-1 truncate"
                            style={{ color: home_team_color || "#e5e7eb" }}
                            title={home_team_name}
                          >
                            {home_team_name}
                            {homeIsWinner && (
                              <FaTrophy className="text-yellow-500 w-4 h-4 ml-1 flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-xl font-black text-white">
                            {homeScore}
                          </div>
                        </div>

                        {/* AWAY TEAM */}
                        <div
                          className={`mt-2 flex items-center justify-between ${
                            awayIsWinner ? "bg-yellow-600/20 rounded px-1" : ""
                          }`}
                        >
                          <div
                            className="font-bold text-sm flex items-center gap-1 truncate"
                            style={{ color: away_team_color || "#e5e7eb" }}
                            title={away_team_name}
                          >
                            {awayIsWinner && (
                              <FaTrophy className="text-yellow-500 w-4 h-4 mr-1 flex-shrink-0" />
                            )}
                            {away_team_name}
                          </div>
                          <div className="text-xl font-black text-white">
                            {awayScore}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
