import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Trophy, Target } from "lucide-react";
import { parseMatchDateTime } from "../components/dateUtils"; // adjust relative path as needed
// Removed import of static upcomingGames; using real data now dummy
import CountdownTimer from "../components/CountdownTimer";
import { motion } from "framer-motion";

interface TopScorer {
  id: number;
  name: string;
  position: string;
  goals: number;
  appearances: number;
  photo: string;
}

interface Player {
  id: number;
  name: string;
  position: string;
  age: number;
  nationality: string;
  jerseyNumber: number;
  height: string;
  weight: string;
  goals: number;
  assists: number;
  appearances: number;
  photo: string;
  bio: string;
}

interface Match {
  id: number;
  date: string;
  time: string;
  opponent?: string | null;
  venue: string;
  competition: string;
  isHome: boolean;
  result?: string;
  home_team_id?: number | null;
  away_team_id?: number | null;
  home_team_name?: string | null;
  home_team_color?: string | null;
  away_team_name?: string | null;
  away_team_color?: string | null;
}

const Home: React.FC = () => {
  // *** ADDED ***
  const [players, setPlayers] = useState<Player[]>([]);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]); // NEW state to hold matches
  const [nextGame, setNextGame] = useState<Match | null>(null); // NEW state for next match

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BASE_URL =
    process.env.NODE_ENV === "development"
      ? "https://feature-vs-new--cognihfxfc.netlify.app/.netlify/functions"
      : "/.netlify/functions";

  // *** MODIFIED: Fetch matches as well ***
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, scorersRes, matchesRes] = await Promise.all([
          fetch(`${BASE_URL}/getPlayers`),
          fetch(`${BASE_URL}/getTopScorers`),
          fetch(`${BASE_URL}/getMatches`), // NEW fetch for matches
        ]);

        if (!playersRes.ok) throw new Error("Failed to fetch players");
        if (!scorersRes.ok) throw new Error("Failed to fetch top scorers");
        if (!matchesRes.ok) throw new Error("Failed to fetch matches");

        const playersData: Player[] = await playersRes.json();
        const scorersData: TopScorer[] = await scorersRes.json();
        const matchesData: Match[] = await matchesRes.json(); // NEW data for matches

        setPlayers(playersData);
        setTopScorers(scorersData);
        setMatches(matchesData); // Set all matches

        // Determine nextGame from fetched matches
        const now = new Date();
        const parseMatchDateTime = (match: Match) => {
          const [year, month, day] = match.date.split("-");
          const [hour = "0", minute = "0"] = (match.time || "00:00").split(":");
          return new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute)
          );
        };

        const upcoming = matchesData
          .filter((m) => parseMatchDateTime(m) >= now)
          .sort(
            (a, b) =>
              parseMatchDateTime(a).getTime() - parseMatchDateTime(b).getTime()
          );

        setNextGame(upcoming[0] || null);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [BASE_URL]);

  const squadCount = players.length;
  const totalGoals = players.reduce((total, p) => total + p.goals, 0);

  const totalWins = 15; // hard-coded for now
  const upcomingMatches = matches.filter((match) => {
    const now = new Date();
    const [year, month, day] = match.date.split("-");
    const [hour = "0", minute = "0"] = (match.time || "00:00").split(":");
    const matchDateTime = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );
    return matchDateTime >= now;
  }).length;

  // *** MODIFIED: Use nextGame from state; fallback message if none ***
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <motion.section
        className="bg-gradient-to-br from-blue-900 via-slate-800 to-blue-800 text-white"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6 drop-shadow-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Cogni Hfx FC
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-blue-100"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              Passion, Pride, Performance
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Link
                to="/games"
                className="bg-blue-600  hover:bg-white hover:text-slate-900 px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg transform hover:scale-105"
              >
                View Fixtures
              </Link>
              <Link
                to="/squad"
                className="bg-blue-600  hover:bg-white hover:text-slate-900 px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg transform hover:scale-105"
              >
                Meet the Squad
              </Link>
              <Link
                to="/standings"
                className="bg-blue-600  hover:bg-white hover:text-slate-900 px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg transform hover:scale-105"
              >
                View League Standings
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Next Match Section */}
      <section className="py-8 md:py-16">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-slate-900">
            Next Match
          </h2>
          <div className="max-w-2xl mx-auto">
            {/* *** MODIFIED: dynamically render nextGame data or fallback *** */}
            {nextGame ? (
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 border-l-4 border-blue-600">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="text-blue-600" size={24} />
                    <span className="text-xs md:text-sm font-medium text-slate-600 uppercase tracking-wider">
                      {nextGame.competition || "friendly"}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      nextGame.isHome
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {nextGame.isHome ? "Home" : "Away"}
                  </span>
                </div>

                <div className="text-center mb-6">
                  <div className="text-lg md:text-2xl font-bold text-slate-900 mb-2 flex justify-center items-center space-x-4">
                    {nextGame.home_team_name && nextGame.away_team_name ? (
                      <>
                        <span
                          style={{ color: nextGame.home_team_color ?? "black" }}
                        >
                          {nextGame.home_team_name}
                        </span>
                        <span className="text-slate-400">vs</span>
                        <span
                          style={{ color: nextGame.away_team_color ?? "black" }}
                        >
                          {nextGame.away_team_name}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-blue-600 font-bold">
                          Cogni Hfx FC
                        </span>
                        <span className="text-slate-400 mx-2">vs</span>
                        <span>{nextGame.opponent}</span>
                      </>
                    )}
                  </div>

                  {nextGame && (
                    <>
                      <CountdownTimer kickOff={parseMatchDateTime(nextGame)} />

                      <div className="text-sm md:text-base text-slate-600 mt-4">
                        <Calendar
                          size={16}
                          className="inline mr-1 text-blue-600"
                        />
                        {parseMatchDateTime(nextGame).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}{" "}
                        at {nextGame.time}
                      </div>
                    </>
                  )}

                  <div className="text-sm text-slate-500 mt-1">
                    {nextGame.venue}
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    to="/games"
                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <Calendar size={20} />
                    <span>View All Fixtures</span>
                  </Link>
                  <Link
                    to={`/match/${nextGame?.id}`}
                    className="inline-flex items-center space-x-2 bg-red-500 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    // optionally disable if no nextGame
                    style={{ marginLeft: "0.5rem" }}
                  >
                    <Trophy size={20} />
                    <span>Match Centre</span>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-600">
                No upcoming match scheduled.
              </p>
            )}
          </div>
        </motion.div>
      </section>

      {/* Top Scorers Section */}
      {!loading && !error && (
        <section className="py-8 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-slate-900">
              Top Scorers
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {topScorers.map((player, i) => (
                <motion.div
                  key={player.id}
                  className="bg-slate-50 rounded-xl p-4 text-center hover:shadow-xl hover:-translate-y-1 transition"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                >
                  <Link
                    key={player.id}
                    to={`/player/${player.id}`}
                    className="group"
                  >
                    <div className="bg-slate-50 rounded-xl p-4 text-center hover:shadow-lg transition">
                      <div className="relative mb-4">
                        <img
                          src={player.photo}
                          alt={player.name}
                          className="w-16 h-16 rounded-full mx-auto object-cover object-top"
                        />
                        {i === 0 && (
                          <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            👑
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold">{player.name}</h3>
                      <p className="text-slate-600 text-xs mb-3">
                        {player.position}
                      </p>
                      <div className="flex items-center justify-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Target className="text-blue-600" size={16} />
                          <span className="font-bold">{player.goals}</span>
                        </div>
                        <div className="text-slate-400">|</div>
                        <div className="text-slate-600 text-xs">
                          {player.appearances} apps
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick Stats Section */}
      <section className="py-8 md:py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          {loading && <p className="text-center">Loading stats...</p>}
          {error && <p className="text-center text-red-400">{error}</p>}
          {!loading && !error && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 md:w-16 h-12 md:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                  <Users size={20} className="md:w-6 md:h-6" />
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-1">
                  {squadCount}
                </div>
                <div className="text-xs md:text-base text-slate-300">
                  Squad Players
                </div>
              </div>
              <div className="text-center">
                <div className="w-12 md:w-16 h-12 md:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                  <Trophy size={20} className="md:w-6 md:h-6" />
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-1">
                  {totalWins}
                </div>
                <div className="text-xs md:text-base text-slate-300">Wins</div>
              </div>
              <div className="text-center">
                <div className="w-12 md:w-16 h-12 md:h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                  <Target size={20} className="md:w-6 md:h-6" />
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-1">
                  {totalGoals}
                </div>
                <div className="text-xs md:text-base text-slate-300">
                  Goals Scored
                </div>
              </div>
              <div className="text-center">
                <div className="w-12 md:w-16 h-12 md:h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                  <Calendar size={20} className="md:w-6 md:h-6" />
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-1">
                  {upcomingMatches}
                </div>
                <div className="text-xs md:text-base text-slate-300">
                  Upcoming
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
