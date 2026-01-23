import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import AddDropdown from "./AddDropDown";
import {
  Home,
  Calendar,
  Users,
  Camera,
  Mail,
  UserPlus,
  CalendarPlus,
  Trophy,
  ShieldPlus,
  Clock,
  BellIcon,
  Newspaper,
  Menu,
  X,
  Search,
  DollarSign,
} from "lucide-react";

// Define Player type
interface Player {
  id: number;
  name: string;
  position: string;
  jerseyNumber: number;
  photo?: string;
  age?: number;
  nationality?: string;
  height?: string;
  weight?: string;
  goals?: number;
  assists?: number;
  appearances?: number;
  bio?: string;
}

type HeaderProps = {
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
};

const Header: React.FC<HeaderProps> = ({ isAdmin, setIsAdmin }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }, [location]);

  // Search players
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("/.netlify/functions/getPlayers");
      const players: Player[] = await response.json();
      const filtered = players.filter((player: Player) =>
        player.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 5));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const mainNavLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/games", label: "Fixtures", icon: Calendar },
    { to: "/squad", label: "Squad", icon: Users },
    { to: "/standings", label: "Standings", icon: Trophy },
    { to: "/gallery", label: "Gallery", icon: Camera },
  ];

  const adminLinks = [
    { to: "/balances", label: "Balances", icon: DollarSign },
    { to: "/add-player", label: "Add Player", icon: UserPlus },
    { to: "/add-match", label: "Add Match", icon: CalendarPlus },
    { to: "/add-team", label: "Add Team", icon: ShieldPlus },
    { to: "/add-booking", label: "Add Booking", icon: Clock },
    { to: "/add-notification", label: "Add Notification", icon: BellIcon },
    { to: "/add-news", label: "Add News", icon: Newspaper },
  ];

  return (
    <>
      <header
        className={`bg-slate-900 text-white shadow-lg fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-slate-900/95 backdrop-blur-md shadow-xl" : ""
        }`}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 md:w-14 md:h-14 overflow-hidden flex-shrink-0">
                <img
                  src="https://res.cloudinary.com/mycloudasif/image/upload/v1755069690/logocogni_wunnvy.png"
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold">COGNI HFX FC</h1>
                <p className="text-xs md:text-sm text-slate-300">
                  Football Club
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-4">
              {mainNavLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(link.to)
                        ? "bg-blue-600 text-white shadow-lg"
                        : "hover:bg-slate-700 text-slate-300 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}

              {isAdmin && <AddDropdown isAdmin={isAdmin} />}

              {/* Admin/Logout Button */}
              {isAdmin ? (
                <button
                  onClick={() => setIsAdmin(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/admin-login"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:block relative ml-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-50 px-4 py-2 pl-10 rounded-lg bg-slate-800 text-white placeholder-slate-400 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* Desktop Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-2xl max-h-80 overflow-y-auto">
                  {searchResults.map((player) => (
                    <Link
                      key={player.id}
                      to={`/player/${player.id}`}
                      className="block px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        {player.photo && (
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">
                            {player.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {player.position} • #{player.jerseyNumber}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Slide-out Menu */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-slate-900 z-50 lg:hidden transform transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <span className="text-white font-bold text-lg">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Search */}
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-lg bg-slate-800 text-white placeholder-slate-400 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Mobile Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-slate-800 rounded-lg max-h-60 overflow-y-auto">
                {searchResults.map((player) => (
                  <Link
                    key={player.id}
                    to={`/player/${player.id}`}
                    className="block px-3 py-3 hover:bg-slate-700 border-b border-slate-700 last:border-b-0 transition-colors"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      {player.photo && (
                        <img
                          src={player.photo}
                          alt={player.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="text-white text-sm font-medium">
                          {player.name}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {player.position} • #{player.jerseyNumber}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Navigation Links */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* Main Links */}
            {mainNavLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(link.to)
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}

            {/* Admin Links */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-2 px-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Admin Actions
                  </h3>
                </div>
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(link.to)
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* Mobile Footer - Admin/Logout */}
          <div className="p-4 border-t border-slate-800">
            {isAdmin ? (
              <button
                onClick={() => {
                  setIsAdmin(false);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/admin-login"
                className="block w-full px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-[72px]" />
    </>
  );
};

export default Header;
