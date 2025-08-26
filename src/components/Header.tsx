import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  Users,
  Camera,
  Mail,
  UserPlus,
  CalendarPlus,
} from "lucide-react";
type HeaderProps = {
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
};
const Header: React.FC<HeaderProps> = ({ isAdmin, setIsAdmin }) => {
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
            <div className="w-14 h-14 overflow-hidden">
              <img
                src="https://res.cloudinary.com/mycloudasif/image/upload/v1755069690/logocogni_wunnvy.png"
                alt="Logo"
                className="w-full h-full object-cover"
              />
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
                isActive("/")
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
            <Link
              to="/games"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive("/games")
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <Calendar size={18} />
              <span>Games</span>
            </Link>
            <Link
              to="/squad"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive("/squad")
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <Users size={18} />
              <span>Squad</span>
            </Link>
            <Link
              to="/gallery"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive("/gallery")
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <Camera size={18} />
              <span>Gallery</span>
            </Link>
            <Link
              to="/contact"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive("/contact")
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <Mail size={18} />
              <span>Contact</span>
            </Link>
            {isAdmin && (
              <Link
                to="/add-player"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive("/add-player")
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-700 text-slate-300 hover:text-white"
                }`}
              >
                {/* You can use any icon you like — here’s an example using the UserPlus icon */}
                <UserPlus size={18} />
                <span>Add Player</span>
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/add-match"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive("/add-match")
                    ? "bg-green-600 text-white"
                    : "hover:bg-slate-700 text-slate-300 hover:text-white"
                }`}
              >
                {/* Use a relevant icon, for example a calendar or plus icon */}
                <CalendarPlus size={18} />
                <span>Add Match</span>
              </Link>
            )}

            {isAdmin && (
              <button
                onClick={() => setIsAdmin(false)}
                className="ml-4 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            )}

            {!isAdmin && (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <Link
                    to="/admin-login"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Admin
                  </Link>
                </div>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isMobileMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>

        {/* Mobile navigation */}
        <nav
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            isMobileMenuOpen
              ? "max-h-64 mt-4 pt-4 border-t border-slate-700"
              : "max-h-0"
          }`}
        >
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex space-x-6 px-4">
              <Link
                to="/"
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg ${
                  isActive("/") ? "text-blue-400" : "text-slate-300"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home size={20} />
                <span className="text-xs">Home</span>
              </Link>
              <Link
                to="/games"
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg ${
                  isActive("/games") ? "text-blue-400" : "text-slate-300"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar size={20} />
                <span className="text-xs">Games</span>
              </Link>
              <Link
                to="/squad"
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg ${
                  isActive("/squad") ? "text-blue-400" : "text-slate-300"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users size={20} />
                <span className="text-xs">Squad</span>
              </Link>
              <Link
                to="/gallery"
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg ${
                  isActive("/gallery") ? "text-blue-400" : "text-slate-300"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Camera size={20} />
                <span className="text-xs">Gallery</span>
              </Link>
              <Link
                to="/contact"
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg ${
                  isActive("/contact") ? "text-blue-400" : "text-slate-300"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Mail size={20} /> {/* or use a Mail icon, if you import one */}
                <span className="text-xs">Contact</span>
              </Link>
              {isAdmin && (
                <Link
                  to="/add-player"
                  className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg ${
                    isActive("/add-player") ? "text-blue-400" : "text-slate-300"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserPlus size={20} />{" "}
                  {/* You can pick another icon if you prefer */}
                  <span className="text-xs">Add Player</span>
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/add-match"
                  className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg ${
                    isActive("/add-match") ? "text-green-400" : "text-slate-300"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <CalendarPlus size={20} />
                  <span className="text-xs">Add Match</span>
                </Link>
              )}

              {!isAdmin && (
                <>
                  {/* Mobile */}
                  <div className="block md:hidden">
                    <Link
                      to="/admin-login"
                      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm transition"
                    >
                      Admin
                    </Link>
                  </div>
                </>
              )}

              {isAdmin && (
                <button
                  onClick={() => {
                    setIsAdmin(false);
                    setIsMobileMenuOpen(false);
                  }}
                  className="
                          max-w-xs
                          min-w-[100px]
                          px-2
                          py-2
                          bg-red-600
                          text-white
                          rounded
                          hover:bg-red-700
                          focus:outline-none
                          focus:ring-2
                          focus:ring-red-500
                          transition
                          duration-150
                          ease-in-out
                          text-center
                          whitespace-nowrap"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
