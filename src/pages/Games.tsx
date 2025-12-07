import React, { useEffect, useState, useRef } from "react";
import { Calendar, MapPin, Clock, Home, Plane } from "lucide-react";
import { Link } from "react-router-dom";
import { parseMatchDateTime } from "../components/dateUtils";
import ThemeProvider from "../components/ThemeProvider";
import Card from "../components/Card";
import Title from "../components/Title";

const API_BASE = "/.netlify/functions";

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
  home_team_id?: number | null;
  away_team_id?: number | null;
  opponent_id?: number | null;
  opponent_name?: string | null;
  opponent_color?: string | null;
  cogni_id?: number | null;
  cogni_name?: string | null;
  cogni_color?: string | null;
  video_url?: string | null;
};

const formatDate = (match: Match) => {
  const date = parseMatchDateTime(match);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
    fetch(`${API_BASE}/getMatchGoals?matchId=${matchId}`)
      .then((res) => res.json())
      .then((data) => {
        setGoalDetails(data as GoalDetail[]);
      });
  }, [matchId]);

  const homeScorers: GoalDetail[] = [];
  const awayScorers: GoalDetail[] = [];

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
    <div className="mt-6 p-5 bg-gradient-to-r from-yellow-600/10 via-yellow-500/10 to-amber-600/10 rounded-xl shadow-xl max-w-md mx-auto border border-yellow-500/30 hover:shadow-2xl transition-shadow duration-300">
      <div className="font-bold text-center mb-3 text-lg text-yellow-400">
        GOAL SCORERS
      </div>
      <div className="flex justify-between text-sm">
        <div className="flex-1 text-left">
          {homeScorers.length > 0 ? (
            <ul className="space-y-1 list-none">
              {homeScorers.map((g) => (
                <li key={g.id} className="uppercase text-white">
                  ⚽ {g.player_name}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400">Not updated</div>
          )}
        </div>
        <div className="flex-1 text-right">
          {awayScorers.length > 0 ? (
            <ul className="space-y-1 list-none">
              {awayScorers.map((g) => (
                <li key={g.id} className="uppercase text-white">
                  {g.player_name} ⚽
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400">Not updated</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Games() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center py-32">
          <div className="text-3xl font-bold text-yellow-400 animate-pulse">
            LOADING MATCHES...
          </div>
        </div>
      </ThemeProvider>
    );
  }

  function isPastMatch(match: Match) {
    const now = new Date();
    const matchDateTime = parseMatchDateTime(match);
    const isPast = matchDateTime < now;
    return isPast;
  }

  const groupByMonth = (matches: Match[]) => {
    const grouped = matches.reduce((acc, match) => {
      const date = new Date(match.date);
      const monthKey = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(match);
      return acc;
    }, {} as Record<string, Match[]>);

    return Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .reduce((result, month) => {
        result[month] = grouped[month].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        return result;
      }, {} as Record<string, Match[]>);
  };
  const upcomingMatches = matches.filter((m) => !isPastMatch(m));
  const pastMatches = matches.filter(isPastMatch);

  upcomingMatches.sort(
    (a, b) => parseMatchDateTime(a).getTime() - parseMatchDateTime(b).getTime()
  );
  pastMatches.sort(
    (a, b) => parseMatchDateTime(b).getTime() - parseMatchDateTime(a).getTime()
  );

  const orderedMatches = [...upcomingMatches, ...pastMatches];

  // Replace the entire return statement after the loading check with this:

  return (
    <ThemeProvider>
      <Title>UPCOMING FIXTURES</Title>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Season Filter Dropdown */}
        <div className="flex justify-center mb-8">
          <select className="px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-yellow-500 focus:outline-none">
            <option>2025/26 Season</option>
            {/* Add more seasons dynamically if available from API */}
            <option>2024/25 Season</option>
          </select>
        </div>

        {/* Grouped Matches */}
        {Object.entries(groupByMonth(orderedMatches)).map(
          ([month, monthGames]) => (
            <section key={month} className="mb-12">
              {/* Month Heading */}
              <h2 className="text-3xl font-bold text-yellow-400 mb-6 border-b border-yellow-500/30 pb-2 flex items-center gap-3">
                <Calendar size={28} className="text-yellow-300" />
                {month}
              </h2>

              {/* Games List */}
              <div className="space-y-6">
                {monthGames.map((game, index) => {
                  const isInternal = game.home_team_name && game.away_team_name;
                  const scores = game.result ? game.result.split("-") : [];

                  return (
                    <Link
                      to={`/match/${game.id}`}
                      key={game.id}
                      className="block group"
                    >
                      <Card className="hover:shadow-2xl transition-shadow duration-300">
                        <div className="p-4 md:p-6 lg:p-8">
                          {/* Competition Badge */}
                          <div className="flex items-center justify-between mb-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600/20 text-blue-300">
                              {game.competition || "friendly"}
                            </span>
                            {!isInternal && (
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                  game.isHome
                                    ? "bg-green-600/20 text-green-400"
                                    : "bg-orange-600/20 text-orange-400"
                                }`}
                              >
                                {game.isHome ? (
                                  <>
                                    <Home size={14} className="mr-1" />
                                    HOME
                                  </>
                                ) : (
                                  <>
                                    <Plane size={14} className="mr-1" />
                                    AWAY
                                  </>
                                )}
                              </span>
                            )}
                          </div>

                          {/* Teams */}
                          <div className="text-center mb-8">
                            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 flex justify-center items-center space-x-3">
                              {isInternal ? (
                                <>
                                  <span
                                    style={{
                                      color: game.home_team_color || "#e5e7eb",
                                    }}
                                  >
                                    {game.home_team_name}
                                  </span>
                                  <span className="text-gray-400">vs</span>
                                  <span
                                    style={{
                                      color: game.away_team_color || "#e5e7eb",
                                    }}
                                  >
                                    {game.away_team_name}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-yellow-400 font-bold">
                                    {game.isHome
                                      ? "Cogni Hfx FC"
                                      : game.cogni_name || "Cogni Hfx FC"}
                                  </span>
                                  <span className="mx-2 md:mx-4 text-gray-400">
                                    vs
                                  </span>
                                  <span>{game.opponent}</span>
                                </>
                              )}
                            </div>

                            {/* Score */}
                            {game.result && scores.length === 2 && (
                              <div className="flex items-center justify-center space-x-2">
                                <span className="px-4 py-2 bg-green-600 text-3xl font-extrabold text-white rounded border border-green-500 shadow">
                                  {scores[0]}
                                </span>
                                <span className="text-2xl font-bold text-gray-400">
                                  -
                                </span>
                                <span className="px-4 py-2 bg-green-600 text-3xl font-extrabold text-white rounded border border-green-500 shadow">
                                  {scores[1]}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Goal Scorers */}
                          <GoalScorers
                            matchId={game.id}
                            match={{
                              home_team_id: game.home_team_id,
                              away_team_id: game.away_team_id,
                              opponent_id: game.opponent_id,
                              cogni_id: game.cogni_id,
                            }}
                          />

                          {/* Info Row */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 text-gray-300 text-sm md:text-base mt-4">
                            <div className="flex items-center justify-center space-x-2">
                              <Calendar size={18} className="text-yellow-400" />
                              <span>{formatDate(game)}</span>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                              <Clock size={18} className="text-yellow-400" />
                              <span>
                                {game.time ? game.time.slice(0, 5) : "TBD"}
                              </span>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                              <MapPin size={18} className="text-yellow-400" />
                              <span>{game.venue}</span>
                            </div>
                          </div>

                          {/* Video */}
                          {game.video_url && (
                            <div className="text-center mt-6">
                              <a
                                href={game.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                                title="Watch on YouTube"
                                style={{ minHeight: "48px" }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="w-5 h-5"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    fill="currentColor"
                                  />
                                  <polygon
                                    points="9,8 9,16 17,12"
                                    fill="#fff"
                                  />
                                </svg>
                                WATCH
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Next Match */}
                        {index === 0 && !isPastMatch(game) && (
                          <div className="flex justify-center -mt-3 mb-3 z-10">
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-red-600 text-white animate-pulse">
                              Next Match
                            </span>
                          </div>
                        )}

                        {/* Bottom Accent */}
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
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )
        )}

        {/* Season Stats */}
        <Card className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold text-center text-yellow-400 mb-6 md:mb-8">
            SEASON OVERVIEW
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-green-400 mb-1 md:mb-2">
                15
              </div>
              <div className="text-sm md:text-base text-gray-400">Wins</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-yellow-400 mb-1 md:mb-2">
                5
              </div>
              <div className="text-sm md:text-base text-gray-400">Draws</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-red-400 mb-1 md:mb-2">
                3
              </div>
              <div className="text-sm md:text-base text-gray-400">Losses</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-blue-400 mb-1 md:mb-2">
                50
              </div>
              <div className="text-sm md:text-base text-gray-400">Points</div>
            </div>
          </div>
        </Card>
      </div>
    </ThemeProvider>
  );
}
