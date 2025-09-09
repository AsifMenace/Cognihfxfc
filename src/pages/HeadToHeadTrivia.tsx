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
    <div className="h2h-trivia p-4 bg-white rounded-lg shadow max-h-[450px] overflow-y-auto w-[320px] text-gray-900 font-sans">
      <h2 className="text-xl font-bold mb-4 border-b pb-2 text-center">
        Head to Head Trivia
      </h2>
      <ul className="space-y-3 text-base leading-relaxed">
        {h2hResults.map(
          (
            { team1, team2, total_matches, team1_wins, team2_wins, draws },
            i
          ) => {
            return (
              <li key={i} className="flex flex-wrap gap-2">
                <span className="font-semibold">
                  {team1} vs {team2}:
                </span>
                <span>
                  played <strong>{total_matches}</strong> match
                  {total_matches !== 1 ? "es" : ""},
                </span>
                <span>
                  <strong>{team1_wins}</strong> won by {team1},
                </span>
                <span>
                  <strong>{team2_wins}</strong> won by {team2}
                  {draws > 0 ? "," : "."}
                </span>
                {draws > 0 && (
                  <span>
                    <strong>{draws}</strong> drawn match
                    {draws !== 1 ? "es" : ""}.
                  </span>
                )}
              </li>
            );
          }
        )}
      </ul>
    </div>
  );
}
