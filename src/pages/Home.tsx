import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Trophy, Target } from "lucide-react";
import { parseMatchDateTime } from "../components/dateUtils"; // adjust relative path as needed
// Removed import of static upcomingGames; using real data now dummy
import CountdownTimer from "../components/CountdownTimer";
import { motion } from "framer-motion";
import LatestNews from "./LatestNews";
import UpcomingBookings from "./UpcomingBookings";
import BookingVotingWidget from "../components/BookingVotingWidget";
import PushSubscribeButton from "../components/PushSubscribeButton";
import PushNotificationPage from "../components/PushNotificationWrapper";
import RecentMatchVideo from "../components/RecentMatchVideo";
import { PlayerOfTheMatch } from "./PlayerOfTheMatch";
import { GetRecentMatch } from "../components/GetRecentMatch";

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
type HomeProps = {
  isAdmin: boolean;
};

const Home: React.FC<HomeProps> = ({ isAdmin }) => {
  // *** ADDED ***
  const [players, setPlayers] = useState<Player[]>([]);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]); // NEW state to hold matches
  const [nextGame, setNextGame] = useState<Match | null>(null); // NEW state for next match

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("Home isAdmin:", isAdmin);

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

  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );

  // *** MODIFIED: Use nextGame from state; fallback message if none ***
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      {/* Image Section - Full Width Hero */}
      <motion.section
        className="relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        {/* Mobile Background Image */}
        <div className="block md:hidden h-[23vh] sm:h-[60vh] overflow-hidden">
          <div className="w-full h-full scale-[1] origin-center">
            <img
              src="/images/hero-mobile.jpg"
              alt="Cogni HFX FC"
              className="w-full h-full object-cover object-[85%_30%]"
            />
          </div>
        </div>

        {/* Desktop Background Image */}
        <div className="hidden md:block h-[60vh] lg:h-[60vh] overflow-hidden">
          <div className="w-full h-full scale-[1] origin-center">
            <img
              src="/images/hero-desktop.jpg"
              alt="Cogni HFX FC"
              className="w-full h-full object-cover object-[center_38%]"
            />
          </div>
        </div>
      </motion.section>

      {/* Text and Buttons Section - Below Image */}
      <motion.section
        className="bg-gradient-to-br from-blue-900 via-slate-800 to-blue-800 text-white"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
      >
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              COGNI HFX FC
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-blue-100"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Built on Belief. Driven by Passion.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <Link
                to="/games"
                className="bg-blue-600 hover:bg-white hover:text-slate-900 px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                View Fixtures
              </Link>
              <Link
                to="/squad"
                className="bg-blue-600 hover:bg-white hover:text-slate-900 px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                Meet the Squad
              </Link>
              <Link
                to="/standings"
                className="bg-blue-600 hover:bg-white hover:text-slate-900 px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                View League Standings
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <div className="mt-6 text-center">
        <p className="mb-2 text-lg">Get notified about new bookings & Polls</p>
        <PushSubscribeButton />
      </div>

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
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 border-l-4">
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

                <div className="text-center flex justify-center space-x-4">
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
{isAdmin && (
      <section className="max-w-lg mx-auto my-6 p-4 sm:p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <BookingVotingWidget />
      </section>
)}
      <div className="flex flex-col items-center mt-10">
        <PlayerOfTheMatch />
      </div>
      <div className="max-w-lg mx-auto my-6 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <GetRecentMatch />
      </div>
      <RecentMatchVideo matches={matches} />

      <section className="py-8 md:py-16">
        <LatestNews />
        <UpcomingBookings
          isAdmin={isAdmin}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </section>
      {/* Top Scorers Section */}
      {!loading && !error && (
        <section className="py-8 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-slate-900">
              Top Scorers
            </h2>
            {/* Horizontal, portrait-style Top Scorers (scrollable) */}
            <div className="max-w-4xl mx-auto overflow-x-auto py-2">
              <div className="flex space-x-4 px-4">
                {topScorers.map((player, i) => (
                  <motion.div
                    key={player.id}
                    className="flex-shrink-0 w-44 sm:w-56 md:w-64 bg-slate-50 rounded-xl p-4 text-center hover:shadow-xl hover:-translate-y-1 transition"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                  >
                    <Link to={`/player/${player.id}`} className="group block">
                      <div className="mb-3">
                        <div
                          className="relative mx-auto rounded-lg overflow-hidden bg-slate-100"
                          style={{ width: "100px", aspectRatio: "3/4" }}
                        >
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="w-full h-full object-cover object-center"
                          />
                          {i === 0 && (
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">
                              👑
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-sm md:text-base truncate">
                        {player.name}
                      </h3>
                      <p className="text-slate-600 text-xs mb-2 truncate">
                        {player.position}
                      </p>

                      <div className="flex items-center justify-center space-x-3 text-sm">
                        <div className="flex items-center space-x-1">
                          <Target className="text-blue-600" size={16} />
                          <span className="font-bold">{player.goals}</span>
                        </div>
                        <div className="text-slate-400">|</div>
                        <div className="text-slate-600 text-xs">
                          {player.appearances} apps
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
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
