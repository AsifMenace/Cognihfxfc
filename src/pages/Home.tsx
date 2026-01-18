import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Trophy, Target, ChevronRight } from "lucide-react";
import { parseMatchDateTime } from "../components/dateUtils";
import CountdownTimer from "../components/CountdownTimer";
import { motion } from "framer-motion";
import LatestNews from "./LatestNews";
import UpcomingBookings from "./UpcomingBookings";
import BookingVotingWidget from "../components/BookingVotingWidget";
import PushSubscribeButton from "../components/PushSubscribeButton";
import RecentMatchVideo from "../components/RecentMatchVideo";
import { PlayerOfTheMatch } from "./PlayerOfTheMatch";
import { GetRecentMatch } from "../components/GetRecentMatch";
import ThemeProvider from "../components/ThemeProvider";
import Card from "../components/Card";
import Title from "../components/Title";

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
  const [players, setPlayers] = useState<Player[]>([]);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [nextGame, setNextGame] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );

  const BASE_URL =
    process.env.NODE_ENV === "development"
      ? "/.netlify/functions"
      : "/.netlify/functions";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, scorersRes, matchesRes] = await Promise.all([
          fetch(`${BASE_URL}/getPlayers`),
          fetch(`${BASE_URL}/getTopScorers`),
          fetch(`${BASE_URL}/getMatches`),
        ]);

        if (!playersRes.ok) throw new Error("Failed to fetch players");
        if (!scorersRes.ok) throw new Error("Failed to fetch top scorers");
        if (!matchesRes.ok) throw new Error("Failed to fetch matches");

        const playersData: Player[] = await playersRes.json();
        const scorersData: TopScorer[] = await scorersRes.json();
        const matchesData: Match[] = await matchesRes.json();

        setPlayers(playersData);
        setTopScorers(scorersData);
        setMatches(matchesData);

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
  const totalWins = 15;
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

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-black text-white">
        {/* Hero Section */}
        <motion.section
          className="relative overflow-hidden -mt-[30px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <div className="block md:hidden h-[23vh] sm:h-[60vh] overflow-hidden">
            <div className="w-full h-full scale-[1] origin-center">
              <img
                src="/images/hero-mobile.jpg"
                alt="Cogni HFX FC"
                className="w-full h-full object-cover object-[85%_30%]"
              />
            </div>
          </div>
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

        {/* Text and Buttons */}
        <motion.section
          className="bg-gradient-to-br from-blue-900 via-slate-800 to-blue-800 text-white"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-4xl mx-auto text-center">
              <motion.h1
                className="text-6xl sm:text-7xl md:text-9xl lg:text-[10rem] font-black mb-4 md:mb-6 tracking-tighter leading-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <span className="text-yellow-400 drop-shadow-2xl">COGNI</span>
                <span className="text-white drop-shadow-2xl"> HFX</span>
                <span className="text-yellow-400 drop-shadow-2xl"> FC</span>
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
                className="flex flex-col sm:flex-row gap-5 justify-center mt-8 w-full max-w-4xl mx-auto px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                {[
                  { to: "/games", label: "View Fixtures", icon: Calendar },
                  { to: "/squad", label: "Meet the Squad", icon: Users },
                  { to: "/standings", label: "League Standings", icon: Trophy },
                ].map((btn, index) => (
                  <Link
                    key={index}
                    to={btn.to}
                    className="group relative flex-1 flex items-center justify-center gap-3 px-6 py-4 overflow-hidden rounded-xl bg-blue-700 border border-slate-700/50 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:border-yellow-500/30 active:scale-95"
                  >
                    {/* 1. Subtle Background Gradient on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />

                    {/* 2. Animated Bottom Highlight Line */}
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-300 group-hover:w-full" />

                    {/* Content */}
                    <btn.icon
                      className="relative z-10 w-5 h-5 text-slate-800 group-hover:text-yellow-400 transition-colors duration-300"
                      strokeWidth={2.5}
                    />
                    <span className="relative z-10 font-bold text-slate-100 tracking-wide group-hover:text-white transition-colors duration-300">
                      {btn.label}
                    </span>
                  </Link>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.section>

        <div className="mt-6 text-center">
          <p className="mb-2 text-lg text-white">
            Get notified about new bookings & Polls
          </p>
          <PushSubscribeButton />
        </div>

        {/* Next Match */}
        <section className="py-8 md:py-16">
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <h2 className="text-6xl md:text-8xl font-black text-center mb-8 tracking-tighter">
              <span className="text-yellow-400 drop-shadow-lg">NEXT</span>
              <span className="text-white"> MATCH</span>
            </h2>
            <div className="max-w-2xl mx-auto">
              {nextGame ? (
                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-4 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <Calendar className="text-yellow-400" size={24} />
                      <span className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider">
                        {nextGame.competition || "friendly"}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        nextGame.isHome
                          ? "bg-green-600/20 text-green-400 border border-green-600/40"
                          : "bg-orange-600/20 text-orange-400 border border-orange-600/40"
                      }`}
                    >
                      {nextGame.isHome ? "Home" : "Away"}
                    </span>
                  </div>
                  <div className="text-center mb-6">
                    <div className="text-lg md:text-2xl font-black text-white mb-2 flex justify-center items-center space-x-4">
                      {nextGame.home_team_name && nextGame.away_team_name ? (
                        <>
                          <span
                            style={{
                              color: nextGame.home_team_color ?? "#fff",
                            }}
                          >
                            {nextGame.home_team_name}
                          </span>
                          <span className="text-gray-500">vs</span>
                          <span
                            style={{
                              color: nextGame.away_team_color ?? "#fff",
                            }}
                          >
                            {nextGame.away_team_name}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-yellow-400 font-black">
                            Cogni Hfx FC
                          </span>
                          <span className="text-gray-500 mx-2">vs</span>
                          <span className="text-white">
                            {nextGame.opponent}
                          </span>
                        </>
                      )}
                    </div>
                    {nextGame && (
                      <>
                        <CountdownTimer
                          kickOff={parseMatchDateTime(nextGame)}
                        />
                        <div className="text-sm md:text-base text-gray-400 mt-4">
                          <Calendar
                            size={16}
                            className="inline mr-1 text-yellow-400"
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
                        <div className="text-sm text-gray-500 mt-1">
                          {nextGame.venue}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 w-full max-w-2xl mx-auto px-4">
                    {[
                      {
                        to: "/games",
                        label: "View All Fixtures",
                        icon: Calendar,
                        accentColor: "blue", // subtle variation
                      },
                      {
                        to: `/match/${nextGame?.id}`,
                        label: "Match Centre",
                        icon: Trophy,
                        accentColor: "yellow",
                        isPrimary: true,
                      },
                    ].map((btn, index) => (
                      <Link
                        key={index}
                        to={btn.to}
                        className={`group relative flex-1 flex items-center justify-center gap-3 px-6 py-4 overflow-hidden rounded-xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95
        /* Increased visibility: lighter slate and stronger border */
        bg-blue-800/80 backdrop-blur-md border border-slate-600/50
        hover:border-yellow-500/50 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]`}
                      >
                        {/* 1. Static Gradient Glow (Always slightly visible to prevent mixing) */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${
                            btn.isPrimary
                              ? "from-yellow-500/5"
                              : "from-blue-500/5"
                          } to-transparent`}
                        />

                        {/* 2. Hover Spotlight - More intense to make it pop */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-tr ${
                            btn.isPrimary
                              ? "from-yellow-500/20"
                              : "from-blue-500/20"
                          } to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                        />

                        {/* 3. The Animated Bottom Line */}
                        <div
                          className={`absolute bottom-0 left-0 h-[3px] w-0 bg-yellow-400 transition-all duration-300 group-hover:w-full`}
                        />

                        {/* Content */}
                        <btn.icon
                          className={`relative z-10 w-5 h-5 transition-colors duration-300 ${
                            btn.isPrimary
                              ? "text-yellow-500"
                              : "text-slate-400 group-hover:text-blue-400"
                          }`}
                          strokeWidth={2.5}
                        />

                        <span className="relative z-10 font-bold text-white tracking-wide transition-colors duration-300">
                          {btn.label}
                        </span>

                        {btn.isPrimary && (
                          <ChevronRight
                            className="relative z-10 w-4 h-4 text-yellow-500 group-hover:translate-x-1 transition-transform"
                            strokeWidth={3}
                          />
                        )}
                      </Link>
                    ))}
                  </div>
                </Card>
              ) : (
                <p className="text-center text-gray-400">
                  No upcoming match scheduled.
                </p>
              )}
            </div>
          </motion.div>
        </section>

        {isAdmin && (
          <section className="max-w-lg mx-auto my-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 p-4 sm:p-6">
              <BookingVotingWidget />
            </div>
          </section>
        )}

        <div className="flex flex-col items-center mt-10">
          <PlayerOfTheMatch />
        </div>

        <div className="max-w-lg mx-auto my-6 p-4 sm:p-6 rounded-lg shadow-lg border border-slate-700 bg-gradient-to-br from-blue-900/50 to-purple-900/50">
          <GetRecentMatch />
        </div>
        <section className="py-12 bg-gradient-to-b from-slate-900 to-black">
          <RecentMatchVideo matches={matches} />
        </section>

        {/* LATEST NEWS — NEW SECTION */}
        <LatestNews />

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 p-6 md:p-8">
          <h2 className="text-6xl md:text-8xl font-black text-center mb-8 tracking-tighter">
            <span className="text-yellow-400 drop-shadow-lg">UPCOMING</span>
            <span className="text-white"> BOOKINGS</span>
          </h2>
          <UpcomingBookings
            isAdmin={isAdmin}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        {/* Top Scorers */}
        {!loading && !error && (
          <section className="py-8 md:py-16 bg-gradient-to-b from-slate-900 to-black">
            <div className="container mx-auto px-4">
              <h2 className="text-6xl md:text-8xl font-black text-center mb-8 tracking-tighter">
                <span className="text-yellow-400 drop-shadow-lg">TOP</span>
                <span className="text-white"> SCORERS</span>
              </h2>
              <div className="max-w-4xl mx-auto overflow-x-auto py-2">
                <div className="flex space-x-4 px-4">
                  {topScorers.map((player, i) => (
                    <motion.div
                      key={player.id}
                      className="flex-shrink-0 w-44 sm:w-56 md:w-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-center hover:shadow-xl hover:-translate-y-1 transition border border-slate-700"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                    >
                      <Link to={`/player/${player.id}`} className="group block">
                        <div className="mb-3">
                          <div
                            className="relative mx-auto rounded-lg overflow-hidden bg-slate-700"
                            style={{ width: "100px", aspectRatio: "3/4" }}
                          >
                            <img
                              src={player.photo}
                              alt={player.name}
                              className="w-full h-full object-cover object-center"
                            />
                            {i === 0 && (
                              <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-amber-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-xs font-black">
                                👑
                              </div>
                            )}
                          </div>
                        </div>
                        <h3 className="font-black text-sm md:text-base truncate text-white">
                          {player.name}
                        </h3>
                        <p className="text-gray-400 text-xs mb-2 truncate">
                          {player.position}
                        </p>
                        <div className="flex items-center justify-center space-x-3 text-sm">
                          <div className="flex items-center space-x-1">
                            <Target className="text-blue-400" size={16} />
                            <span className="font-bold text-white">
                              {player.goals}
                            </span>
                          </div>
                          <div className="text-gray-500">|</div>
                          <div className="text-gray-400 text-xs">
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

        {/* Quick Stats */}
        <section className="py-8 md:py-16 bg-black text-white">
          <div className="container mx-auto px-4">
            {loading && (
              <p className="text-center text-gray-400">Loading stats...</p>
            )}
            {error && <p className="text-center text-red-400">{error}</p>}
            {!loading && !error && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-12 md:w-16 h-12 md:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                    <Users size={20} className="md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black mb-1 text-white">
                    {squadCount}
                  </div>
                  <div className="text-xs md:text-base text-gray-400">
                    Squad Players
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-12 md:w-16 h-12 md:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                    <Trophy size={20} className="md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black mb-1 text-white">
                    {totalWins}
                  </div>
                  <div className="text-xs md:text-base text-gray-400">Wins</div>
                </div>
                <div className="text-center">
                  <div className="w-12 md:w-16 h-12 md:h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                    <Target size={20} className="md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black mb-1 text-white">
                    {totalGoals}
                  </div>
                  <div className="text-xs md:text-base text-gray-400">
                    Goals Scored
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-12 md:w-16 h-12 md:h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                    <Calendar size={20} className="md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black mb-1 text-white">
                    {upcomingMatches}
                  </div>
                  <div className="text-xs md:text-base text-gray-400">
                    Upcoming
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </ThemeProvider>
  );
};

export default Home;
