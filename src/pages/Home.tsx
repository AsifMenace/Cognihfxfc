import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Trophy, Target } from 'lucide-react';
import { upcomingGames, players } from '../data/mockData';

const Home: React.FC = () => {
  const nextGame = upcomingGames[0];
  const topScorers = players
    .filter(player => player.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-slate-800 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6">
            Cogni Hfx FC
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-blue-100">
              Passion, Pride, Performance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/games"
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                View Fixtures
              </Link>
              <Link
                to="/squad"
                className="bg-transparent border-2 border-white hover:bg-white hover:text-slate-900 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Meet the Squad
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Next Match Section */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-slate-900">Next Match</h2>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 border-l-4 border-blue-600">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="text-blue-600" size={24} />
                  <span className="text-xs md:text-sm font-medium text-slate-600 uppercase tracking-wider">
                    {nextGame.competition}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  nextGame.isHome ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {nextGame.isHome ? 'Home' : 'Away'}
                </span>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-lg md:text-2xl font-bold text-slate-900 mb-2">
                  Cogni Hfx FC vs {nextGame.opponent}
                </div>
                <div className="text-sm md:text-base text-slate-600">
                  {new Date(nextGame.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} at {nextGame.time}
                </div>
                <div className="text-sm text-slate-500 mt-1">{nextGame.venue}</div>
              </div>
              
              <div className="text-center">
                <Link
                  to="/games"
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Calendar size={20} />
                  <span>View All Fixtures</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Scorers Section */}
      <section className="py-8 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-slate-900">Top Scorers</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto">
            {topScorers.map((player, index) => (
              <Link
                key={player.id}
                to={`/player/${player.id}`}
                className="group"
              >
                <div className="bg-slate-50 rounded-xl p-4 md:p-6 text-center hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <div className="relative mb-4">
                    <img
                      src={player.photo}
                      alt={player.name}
                      className="w-16 md:w-20 h-16 md:h-20 rounded-full mx-auto object-cover"
                    />
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-yellow-400 text-yellow-900 w-6 md:w-8 h-6 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
                        👑
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-base md:text-lg text-slate-900 mb-1">{player.name}</h3>
                  <p className="text-slate-600 text-xs md:text-sm mb-3">{player.position}</p>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Target className="text-blue-600" size={16} />
                      <span className="font-bold text-base md:text-lg text-slate-900">{player.goals}</span>
                    </div>
                    <div className="text-slate-400">|</div>
                    <div className="text-slate-600 text-xs md:text-sm">{player.appearances} apps</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="py-8 md:py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 md:w-16 h-12 md:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                <Users size={20} className="md:w-6 md:h-6" />
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{players.length}</div>
              <div className="text-xs md:text-base text-slate-300">Squad Players</div>
            </div>
            <div className="text-center">
              <div className="w-12 md:w-16 h-12 md:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                <Trophy size={20} className="md:w-6 md:h-6" />
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">15</div>
              <div className="text-xs md:text-base text-slate-300">Wins</div>
            </div>
            <div className="text-center">
              <div className="w-12 md:w-16 h-12 md:h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                <Target size={20} className="md:w-6 md:h-6" />
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
                {players.reduce((total, player) => total + player.goals, 0)}
              </div>
              <div className="text-xs md:text-base text-slate-300">Goals Scored</div>
            </div>
            <div className="text-center">
              <div className="w-12 md:w-16 h-12 md:h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                <Calendar size={20} className="md:w-6 md:h-6" />
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{upcomingGames.length}</div>
              <div className="text-xs md:text-base text-slate-300">Upcoming</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;