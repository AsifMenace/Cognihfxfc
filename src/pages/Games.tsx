import React, { useEffect, useState } from "react";
import { Calendar, MapPin, Clock, Home, Plane } from "lucide-react";
import { Link } from "react-router-dom"; // Make sure Link is imported
import { parseMatchDateTime } from "../components/dateUtils"; // Utility function to parse date and time

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "/.netlify/functions"
    : "/.netlify/functions";

type Match = {
  id: number;
  date: string;
  time: string;
  opponent?: string | null;
  venue: string;
  result?: string;
  competition?: string;
  isHome?: boolean;
  home_team_name?: string | null;
  home_team_color?: string | null;
  away_team_name?: string | null;
  away_team_color?: string | null;
  home_team_id?: number | null; // Add this line
  away_team_id?: number | null; // Add this line
  opponent_id?: number | null;
  opponent_name?: string | null;
  opponent_color?: string | null;
  cogni_id?: number | null;
  cogni_name?: string | null;
  cogni_color?: string | null;
};

const formatDate = (match: Match) => {
  const date = parseMatchDateTime(match);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function MatchListItem({ match }: { match: Match }) {
  const isInternal = match.home_team_name && match.away_team_name;

  return (
    <div className="match-item border p-4 rounded mb-4">
      <div className="date-time mb-2">
        <strong>{match.date}</strong> at <strong>{match.time}</strong>
      </div>
      <div className="teams flex items-center justify-between mb-2">
        {isInternal ? (
          <>
            <span
              className="home-team font-bold"
              style={{ color: match.home_team_color || "black" }}
            >
              {match.home_team_name}
            </span>
            <span>vs</span>
            <span
              className="away-team font-bold"
              style={{ color: match.away_team_color || "black" }}
            >
              {match.away_team_name}
            </span>
          </>
        ) : (
          <span className="opponent font-bold">{match.opponent}</span>
        )}
      </div>
      <div className="venue mb-1">Venue: {match.venue}</div>
      <div className="result">Result: {match.result || "TBD"}</div>
    </div>
  );
}

type Scorers = {
  player_name: string;
  team_name: string;
};

interface GoalScorersProps {
  matchId: number;
  match: {
    home_team_id?: number | null;
    away_team_id?: number | null;
    opponent_id?: number | null;
    cogni_id?: number | null;
  };
}

interface GoalDetail {
  id: number;
  player_id: number;
  player_name: string;
  team_name: string;
  team_id: number;
}

function GoalScorers({ matchId, match }: GoalScorersProps) {
  const [goalDetails, setGoalDetails] = useState<GoalDetail[]>([]);
  useEffect(() => {
    fetch(`/.netlify/functions/getMatchGoals?matchId=${matchId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched goals for match", matchId, data); // <-- Add this line
        setGoalDetails(data as GoalDetail[]);
      });
  }, [matchId]);

  const homeScorers = [];
  const awayScorers = [];
  if (match.home_team_id || match.cogni_id) {
    homeScorers.push(
      ...goalDetails.filter(
        (g) => g.team_id == match.home_team_id || g.team_id == match.cogni_id
      )
    );
  }

  if (match.away_team_id || match.opponent_id) {
    awayScorers.push(
      ...goalDetails.filter(
        (g) => g.team_id == match.away_team_id || g.team_id == match.opponent_id
      )
    );
  }

  return (
    <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 via-blue-200 to-blue-50 rounded-xl shadow-xl max-w-md mx-auto text-gray-800 border border-blue-300 hover:shadow-2xl transition-shadow duration-300">
      <div className="font-semibold text-center mb-3 text-lg text-blue-700">
        Goal Scorers
      </div>
      <div className="flex justify-between">
        <div className="flex-1 text-left">
          {homeScorers.length > 0 ? (
            <ul className="space-y-1 list-none">
              {homeScorers.map((g) => (
                <li key={g.id} className="uppercase">
                  ⚽ {g.player_name}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400"> Not updated </div>
          )}
        </div>
        <div className="flex-1 text-right">
          {awayScorers.length > 0 ? (
            <ul className="space-y-1 list-none">
              {awayScorers.map((g) => (
                <li key={g.id} className="uppercase">
                  ⚽ {g.player_name}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400"> Not updated </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Games() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/getMatches`)
      .then((res) => res.json())
      .then((data) => {
        setMatches(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading matches...</div>;
  }

  function isPastMatch(match: Match) {
    const now = new Date();
    const matchDateTime = parseMatchDateTime(match);
    const isPast = matchDateTime < now;
    console.log(
      `Match ${match.opponent} at ${match.date} ${match.time} isPast: ${isPast}`
    );
    return isPast;
  }

  const upcomingMatches = matches.filter((m) => !isPastMatch(m));
  const pastMatches = matches.filter(isPastMatch);

  // upcomingMatches.sort(
  //   (a, b) =>
  //     new Date(`${a.date}T${a.time || "00:00"}`).getTime() -
  //     new Date(`${b.date}T${b.time || "00:00"}`).getTime()
  // );

  // pastMatches.sort(
  //   (a, b) =>
  //     new Date(`${b.date}T${b.time || "00:00"}`).getTime() -
  //     new Date(`${a.date}T${a.time || "00:00"}`).getTime()
  // );
  upcomingMatches.sort(
    (a, b) => parseMatchDateTime(a).getTime() - parseMatchDateTime(b).getTime()
  );

  pastMatches.sort(
    (a, b) => parseMatchDateTime(b).getTime() - parseMatchDateTime(a).getTime()
  );

  const orderedMatches = [...upcomingMatches, ...pastMatches];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Upcoming Fixtures
          </h1>
          <p className="text-lg md:text-xl text-slate-600 px-4">
            Don't miss any of our exciting matches this season
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {orderedMatches.map((game, index) => {
            const isInternal = game.home_team_name && game.away_team_name;
            // Parse score parts once
            const scores = game.result ? game.result.split("-") : [];

            return (
              <Link
                to={`/match/${game.id}`}
                key={game.id}
                className="block group"
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="p-4 md:p-6 lg:p-8">
                    {/* Competition Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {game.competition || "friendly"}
                      </span>
                      {/* Hide home/away badge because it's not relevant for internal matches */}
                      {!isInternal && (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            game.isHome
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {game.isHome ? (
                            <>
                              <Home size={14} className="mr-1" />
                              Home
                            </>
                          ) : (
                            <>
                              <Plane size={14} className="mr-1" />
                              Away
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Main Match Info */}
                    <div className="text-center mb-8">
                      <div className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-4 flex justify-center items-center space-x-3">
                        {isInternal ? (
                          <>
                            <span
                              className="font-bold"
                              style={{ color: game.home_team_color || "black" }}
                            >
                              {game.home_team_name}
                            </span>
                            <span className="text-slate-400">vs</span>
                            <span
                              className="font-bold"
                              style={{ color: game.away_team_color || "black" }}
                            >
                              {game.away_team_name}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-blue-600 font-bold">
                              {game.isHome
                                ? "Cogni Hfx FC"
                                : game.cogni_name || "Cogni Hfx FC"}
                            </span>
                            <span className="mx-2 md:mx-4 text-slate-400">
                              vs
                            </span>
                            <span>{game.opponent}</span>
                          </>
                        )}
                      </div>

                      {/* Show score if match is completed */}
                      {game.result && scores.length === 2 && (
                        <div className="ml-4 flex items-center justify-center space-x-2">
                          <span className="px-4 py-2 bg-green-300 text-3xl font-extrabold text-slate-900 rounded border border-blue-300 shadow">
                            {scores[0]}
                          </span>
                          <span className="text-2xl font-bold text-slate-700">
                            -
                          </span>
                          <span className="px-4 py-2 bg-green-300 text-3xl font-extrabold text-slate-900 rounded border border-blue-300 shadow">
                            {scores[1]}
                          </span>
                        </div>
                      )}

                      {/* Goal Scorers component rendering */}
                      <GoalScorers
                        matchId={game.id}
                        match={{
                          home_team_id: game.home_team_id,
                          away_team_id: game.away_team_id,
                          opponent_id: game.opponent_id,
                          cogni_id: game.cogni_id,
                        }}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 text-slate-600 text-sm md:text-base mt-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Calendar size={18} className="text-blue-600" />
                          <span>{formatDate(game)}</span>
                        </div>

                        <div className="flex items-center justify-center space-x-2">
                          <Clock size={18} className="text-blue-600" />
                          <span>
                            {game.time ? game.time.slice(0, 5) : "TBD"}
                          </span>
                        </div>

                        <div className="flex items-center justify-center space-x-2">
                          <MapPin size={18} className="text-blue-600" />
                          <span>{game.venue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Priority Indicator */}
                    {index === 0 && !isPastMatch(game) && (
                      <div className="text-center">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          🔥 Next Match
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom accent line */}
                  <div
                    className={`h-1 ${
                      index === 0
                        ? "bg-red-500"
                        : isInternal
                        ? "bg-purple-500"
                        : game.isHome
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                  ></div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Season Stats */}
        <div className="mt-8 md:mt-16 bg-white rounded-xl shadow-lg p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-center text-slate-900 mb-6 md:mb-8">
            Season Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1 md:mb-2">
                15
              </div>
              <div className="text-sm md:text-base text-slate-600">Wins</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-1 md:mb-2">
                5
              </div>
              <div className="text-sm md:text-base text-slate-600">Draws</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-red-600 mb-1 md:mb-2">
                3
              </div>
              <div className="text-sm md:text-base text-slate-600">Losses</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1 md:mb-2">
                50
              </div>
              <div className="text-sm md:text-base text-slate-600">Points</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Games;
