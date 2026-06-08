import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import {
  Home,
  Calendar,
  Users,
  Camera,
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
  MapPin,
  CalendarCheck,
  LogOut,
  LogIn,
} from 'lucide-react';

interface Player {
  id: number;
  name: string;
  position: string;
  jerseyNumber: number;
  photo?: string;
}

type HeaderProps = {
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
};

const mainNavLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/games', label: 'Fixtures', icon: Calendar },
  { to: '/squad', label: 'Squad', icon: Users },
  { to: '/squad-creator', label: 'Squad Creator', icon: Zap },
  { to: '/standings', label: 'Standings', icon: Trophy },
  { to: '/gallery', label: 'Gallery', icon: Camera },
  { to: '/balances', label: 'Balances', icon: DollarSign },
  { to: '/predict', label: 'Predictor', icon: Globe },
  { to: '/player-map', label: 'Player Map', icon: MapPin },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck },
];

const adminLinks = [
  { to: '/add-player', label: 'Add Player', icon: UserPlus },
  { to: '/add-match', label: 'Add Match', icon: CalendarPlus },
  { to: '/add-team', label: 'Add Team', icon: ShieldPlus },
  { to: '/add-booking', label: 'Add Booking', icon: Clock },
  { to: '/wc-admin', label: 'WC Admin', icon: Trophy },
  { to: '/add-notification', label: 'Add Notification', icon: BellIcon },
  { to: '/add-news', label: 'Add News', icon: Newspaper },
];

const Header: React.FC<HeaderProps> = ({
  isAdmin,
  setIsAdmin,
  sidebarCollapsed,
  setSidebarCollapsed,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, [location]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch('/.netlify/functions/getPlayers');
      const players: Player[] = await response.json();
      setSearchResults(
        players.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
      );
    } catch {
      /* ignore */
    } finally {
      setIsSearching(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    navigate('/');
    setIsAdmin(false);
    setIsMobileMenuOpen(false);
  };

  // ── Sidebar nav link ────────────────────────────────────────────────────────
  const SidebarLink = ({
    to,
    label,
    icon: Icon,
  }: {
    to: string;
    label: string;
    icon: React.ElementType;
  }) => (
    <div className="relative group/tip">
      <Link
        to={to}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
          isActive(to)
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon size={20} className="flex-shrink-0" />
        {!sidebarCollapsed && <span className="font-medium text-sm truncate">{label}</span>}
      </Link>
      {/* Tooltip when collapsed */}
      {sidebarCollapsed && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-700 text-white text-xs font-medium rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity duration-150 z-[60] shadow-xl">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-700" />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-slate-900 border-r border-slate-700/50 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo + toggle */}
        <div
          className={`flex items-center border-b border-slate-700/50 h-16 flex-shrink-0 ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'}`}
        >
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <img
                src="https://res.cloudinary.com/mycloudasif/image/upload/v1755069690/logocogni_wunnvy.png"
                alt="Logo"
                className="w-8 h-8 object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-black text-white leading-tight truncate">COGNI HFX FC</p>
                <p className="text-xs text-slate-400 truncate">Football Club</p>
              </div>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/">
              <img
                src="https://res.cloudinary.com/mycloudasif/image/upload/v1755069690/logocogni_wunnvy.png"
                alt="Logo"
                className="w-8 h-8 object-cover"
              />
            </Link>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${sidebarCollapsed ? 'absolute -right-3 top-5 bg-slate-800 border border-slate-700 shadow-lg' : ''}`}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {!sidebarCollapsed && (
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 pb-2">
              Navigation
            </p>
          )}
          {mainNavLinks.map((link) => (
            <SidebarLink key={link.to} {...link} />
          ))}

          {isAdmin && (
            <>
              <div className={`pt-4 pb-2 ${sidebarCollapsed ? 'px-1' : 'px-3'}`}>
                {!sidebarCollapsed ? (
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Admin
                  </p>
                ) : (
                  <div className="h-px bg-slate-700" />
                )}
              </div>
              {adminLinks.map((link) => (
                <SidebarLink key={link.to} {...link} />
              ))}
            </>
          )}
        </nav>

        {/* Bottom: search + auth */}
        <div className="border-t border-slate-700/50 p-2 space-y-2 flex-shrink-0">
          {/* Search */}
          {!sidebarCollapsed && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              {searchResults.length > 0 && (
                <div className="absolute bottom-full mb-2 w-full bg-white rounded-lg shadow-2xl max-h-64 overflow-y-auto z-50">
                  {searchResults.map((player) => (
                    <Link
                      key={player.id}
                      to={`/player/${player.id}`}
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                    >
                      {player.photo && (
                        <img
                          src={player.photo}
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{player.name}</p>
                        <p className="text-xs text-gray-500">{player.position}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Auth button */}
          <div className="relative group/tip">
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <LogOut size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
              </button>
            ) : (
              <Link
                to="/admin-login"
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <LogIn size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">Admin Login</span>}
              </Link>
            )}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-700 text-white text-xs font-medium rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-[60] shadow-xl">
                {isAdmin ? 'Logout' : 'Admin Login'}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-700" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile: top header ── */}
      <header className="lg:hidden bg-slate-900 text-white shadow-lg fixed top-0 left-0 right-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/mycloudasif/image/upload/v1755069690/logocogni_wunnvy.png"
              alt="Logo"
              className="w-10 h-10 object-cover"
            />
            <div>
              <h1 className="text-base font-bold">COGNI HFX FC</h1>
              <p className="text-xs text-slate-300">Football Club</p>
            </div>
          </Link>
          <button
            className="text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile slide-out menu */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-slate-900 z-50 lg:hidden transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <span className="text-white font-bold text-lg">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white p-2 hover:bg-slate-800 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile search */}
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
            {searchResults.length > 0 && (
              <div className="mt-2 bg-slate-800 rounded-lg max-h-60 overflow-y-auto">
                {searchResults.map((player) => (
                  <Link
                    key={player.id}
                    to={`/player/${player.id}`}
                    className="flex items-center gap-3 px-3 py-3 hover:bg-slate-700 border-b border-slate-700 last:border-0 transition-colors"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {player.photo && (
                      <img
                        src={player.photo}
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">{player.name}</p>
                      <p className="text-slate-400 text-xs">{player.position}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile nav links */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {mainNavLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(to)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </Link>
            ))}

            {isAdmin && (
              <>
                <div className="pt-4 pb-2 px-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Admin Actions
                  </h3>
                </div>
                {adminLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(to)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{label}</span>
                  </Link>
                ))}
              </>
            )}
          </div>

          <div className="p-4 border-t border-slate-800">
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/admin-login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-center"
              >
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile top-header spacer */}
      <div className="h-[60px] lg:hidden" />
    </>
  );
};

export default Header;
