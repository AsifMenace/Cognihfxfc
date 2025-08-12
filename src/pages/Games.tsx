import React from 'react';
import { Calendar, MapPin, Clock, Home, Plane } from 'lucide-react';
import { upcomingGames } from '../data/mockData';

const Games: React.FC = () => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Upcoming Fixtures</h1>
          <p className="text-lg md:text-xl text-slate-600 px-4">Don't miss any of our exciting matches this season</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {upcomingGames.map((game, index) => (
            <div
              key={game.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-4 md:p-6 lg:p-8">
                {/* Competition Badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {game.competition}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    game.isHome 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
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
                </div>

                {/* Main Match Info */}
                <div className="text-center mb-8">
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                    <span className="text-blue-600">Cogni Hfx FC</span>
                    <span className="mx-2 md:mx-4 text-slate-400">vs</span>
                    <span>{game.opponent}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 text-slate-600 text-sm md:text-base">
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar size={18} className="text-blue-600" />
                      <span>{formatDate(game.date)}</span>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2">
                      <Clock size={18} className="text-blue-600" />
                      <span>{game.time}</span>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2">
                      <MapPin size={18} className="text-blue-600" />
                      <span>{game.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Match Priority Indicator */}
                {index === 0 && (
                  <div className="text-center">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      🔥 Next Match
                    </span>
                  </div>
                )}
              </div>
              
              {/* Bottom accent line */}
              <div className={`h-1 ${
                index === 0 ? 'bg-red-500' : game.isHome ? 'bg-green-500' : 'bg-blue-500'
              }`}></div>
            </div>
          ))}
        </div>

        {/* Season Stats */}
        <div className="mt-8 md:mt-16 bg-white rounded-xl shadow-lg p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-center text-slate-900 mb-6 md:mb-8">Season Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1 md:mb-2">15</div>
              <div className="text-sm md:text-base text-slate-600">Wins</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-1 md:mb-2">5</div>
              <div className="text-sm md:text-base text-slate-600">Draws</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-red-600 mb-1 md:mb-2">3</div>
              <div className="text-sm md:text-base text-slate-600">Losses</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1 md:mb-2">50</div>
              <div className="text-sm md:text-base text-slate-600">Points</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Games;