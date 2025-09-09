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
    async function fetchH2H() {
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
        if (err instanceof Error) {
          setError(err.message || "Failed to load head to head results");
          setH2hResults([]);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchH2H();
  }, []);

  if (loading)
    return (
      <div className="text-center p-4">Loading head to head trivia...</div>
    );
  if (error)
    return <div className="text-red-600 p-4 text-center">Error: {error}</div>;
  if (h2hResults.length === 0)
    return (
      <div className="p-4 text-center">No head to head data available.</div>
    );

  return (
    <div className="h2h-trivia p-5 bg-white rounded-xl shadow-lg max-h-[450px] overflow-y-auto w-[320px] text-gray-900 font-sans">
      <h2 className="text-2xl font-bold mb-6 border-b border-gray-300 pb-3 text-center">
        Head to Head Trivia
      </h2>
      <ul className="space-y-5">
        {h2hResults.map(
          (
            { team1, team2, total_matches, team1_wins, team2_wins, draws },
            i
          ) => (
            <li
              key={i}
              className="bg-gray-50 rounded-md border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="text-lg font-semibold mb-2 text-center">
                {team1} vs {team2}
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-700">
                <div>
                  Played <strong>{total_matches}</strong> match
                  {total_matches !== 1 ? "es" : ""}
                </div>
                <div>
                  <strong>{team1_wins}</strong> won by {team1}
                </div>
                <div>
                  <strong>{team2_wins}</strong> won by {team2}
                </div>
                {draws > 0 && (
                  <div>
                    <strong>{draws}</strong> drawn match
                    {draws !== 1 ? "es" : ""}
                  </div>
                )}
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
