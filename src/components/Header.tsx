import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, Camera, Mail } from 'lucide-react';


const Header: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">FC</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Cogni Hfx FC</h1>
              <p className="text-sm text-slate-300">Football Club</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
            <Link
              to="/games"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/games') 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Calendar size={18} />
              <span>Games</span>
            </Link>
            <Link
              to="/squad"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/squad') 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Users size={18} />
              <span>Squad</span>
            </Link>
            <Link
              to="/gallery"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/gallery') 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Camera size={18} />
              <span>Gallery</span>
            </Link>
            <Link
              to="/contact"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/contact')
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Mail size={18} />
              <span>Contact</span>
            </Link>

          </nav>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
        
        {/* Mobile navigation */}
        <nav className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-64 mt-4 pt-4 border-t border-slate-700' : 'max-h-0'
        }`}>
          <div className="flex justify-around">
            <Link
              to="/"
              className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg ${
                isActive('/') ? 'text-blue-400' : 'text-slate-300'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home size={20} />
              <span className="text-xs">Home</span>
            </Link>
            <Link
              to="/games"
              className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg ${
                isActive('/games') ? 'text-blue-400' : 'text-slate-300'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Calendar size={20} />
              <span className="text-xs">Games</span>
            </Link>
            <Link
              to="/squad"
              className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg ${
                isActive('/squad') ? 'text-blue-400' : 'text-slate-300'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Users size={20} />
              <span className="text-xs">Squad</span>
            </Link>
            <Link
              to="/gallery"
              className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg ${
                isActive('/gallery') ? 'text-blue-400' : 'text-slate-300'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Camera size={20} />
              <span className="text-xs">Gallery</span>
            </Link>
            <Link
                to="/contact"
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg ${
                  isActive('/contact') ? 'text-blue-400' : 'text-slate-300'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Camera size={20} /> {/* or use a Mail icon, if you import one */}
                <span className="text-xs">Contact</span>
              </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;