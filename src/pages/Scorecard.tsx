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
          new Set(data.map((m) => m.date.split("T")[0]))
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
        if (err instanceof Error) {
          setError(err.message);
        } else setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading)
    return <div className="text-center p-4">Loading scorecard...</div>;
  if (error)
    return <div className="text-red-600 text-center p-4">Error: {error}</div>;
  if (results.length === 0)
    return (
      <div className="text-center p-4">No league match results available.</div>
    );

  return (
    <div
      className="scorecard bg-white rounded-lg shadow-lg w-full max-w-xs sm:w-[520px] p-6 text-gray-900 font-sans
  overflow-visible sm:overflow-y-auto sm:max-h-[450px]"
    >
      <div
        className="
    flex flex-row gap-4 overflow-x-auto flex-nowrap
    sm:flex-col sm:gap-0 sm:overflow-x-visible
  "
      >
        {Object.entries(groupedResults)
          .sort(([a], [b]) => {
            const numA = parseInt(a.split(" ")[1], 10);
            const numB = parseInt(b.split(" ")[1], 10);
            return numB - numA;
          })
          .map(([dayLabel, matches]) => (
            <div
              key={dayLabel}
              className="min-w-[270px] max-w-[320px] flex-shrink-0 mb-0 sm:min-w-0 sm:max-w-full sm:mb-6"
            >
              <div className="mb-3 text-lg font-extrabold tracking-wider text-blue-700 border-b-2 border-blue-400 pb-1">
                {dayLabel}
              </div>
              <ul className="space-y-3">
                {matches.map(
                  (
                    {
                      home_team_name,
                      away_team_name,
                      result,
                      home_team_color,
                      away_team_color,
                    }: MatchResult,
                    i
                  ) => {
                    const [homeScoreStr, awayScoreStr] = result.split("-");
                    const homeScore = parseInt(homeScoreStr, 10);
                    const awayScore = parseInt(awayScoreStr, 10);

                    const homeIsWinner = homeScore > awayScore;
                    const awayIsWinner = awayScore > homeScore;

                    return (
                      <li
                        key={i}
                        className="flex flex-col rounded-md p-3 bg-gradient-to-r from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow duration-300 w-full"
                      >
                        {/* Home team row */}
                        <div
                          className={`flex items-center justify-between ${
                            homeIsWinner ? "bg-yellow-100 rounded px-1" : ""
                          }`}
                        >
                          <div
                            className="font-semibold text-md flex items-center"
                            style={{
                              color: home_team_color,
                              minWidth: 0,
                            }}
                            title={home_team_name}
                          >
                            {home_team_name}
                            {homeIsWinner && (
                              <span
                                className="flex-shrink-0 flex items-center pl-2 ml-1"
                                style={{ width: 22 }}
                              >
                                <FaTrophy className="text-yellow-500 w-5 h-5" />
                              </span>
                            )}
                          </div>
                          <div className="text-gray-800 font-mono font-bold text-lg ml-2">
                            {homeScore}
                          </div>
                        </div>

                        {/* Away team row */}
                        <div
                          className={`mt-1 flex items-center justify-between ${
                            awayIsWinner ? "bg-yellow-100 rounded px-1" : ""
                          }`}
                        >
                          <div
                            className="font-semibold text-md flex items-center"
                            style={{
                              color: away_team_color,
                              minWidth: 0,
                            }}
                            title={away_team_name}
                          >
                            {awayIsWinner && (
                              <span
                                className="flex-shrink-0 flex items-center pr-2 mr-1"
                                style={{ width: 22 }}
                              >
                                <FaTrophy className="text-yellow-500 w-5 h-5" />
                              </span>
                            )}
                            {away_team_name}
                          </div>
                          <div className="text-gray-800 font-mono font-bold text-lg ml-2">
                            {awayScore}
                          </div>
                        </div>
                      </li>
                    );
                  }
                )}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}
