import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Games from './pages/Games';
import Squad from './pages/Squad';
import PlayerDetail from './pages/PlayerDetail';
import Gallery from './pages/Gallery';
import AddPlayer from './pages/AddPlayer';
import EditPlayer from './pages/EditPlayer';
import { useState } from 'react';
import { AdminLogin } from './components/AdminLogin';
import { AddMatch } from './pages/AddMatch'; // create this page/component
import MatchCentre from './pages/MatchCentre';
import { LeagueStandings } from './pages/LeagueStandings';
import { AddTeam } from './pages/AddTeam';
import AddBooking from './pages/AddBooking';
import AdminNotification from './pages/AdminNotificationPage';
import { UpdatePrompt } from './components/UpdatePrompt'; //
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
import AddNews from './pages/AddNews';
import ScrollToTop from './components/ScrollToTop';
import Balances from './pages/Balances';
import { SquadCreator } from './pages/SquadCreator';
import BookingsPage from './pages/BookingsPage';
import PlayerMap from './pages/PlayerMap';
import WcPredict from './pages/WcPredict';
import WcAdmin from './pages/WcAdmin';

function App() {
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('adminToken') !== null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  );

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value);
    if (!value) localStorage.removeItem('adminToken');
  };

  const handleSidebarCollapsed = (value: boolean) => {
    setSidebarCollapsed(value);
    localStorage.setItem('sidebarCollapsed', String(value));
  };

  const { updateAvailable, handleRefresh } = useServiceWorkerUpdate();
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-slate-50">
        <UpdatePrompt show={updateAvailable} onRefresh={handleRefresh} />
        <Header
          isAdmin={isAdmin}
          setIsAdmin={handleSetIsAdmin}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={handleSidebarCollapsed}
        />
        <div
          className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
        >
          <Routes>
            <Route path="/" element={<Home isAdmin={isAdmin} />} />
            <Route path="/games" element={<Games />} />
            <Route path="/standings" element={<LeagueStandings />} />
            <Route path="/predict" element={<WcPredict />} />

            <Route path="/squad" element={<Squad isAdmin={isAdmin} />} />
            <Route path="/squad-creator" element={<SquadCreator isAdmin={isAdmin} />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/player/:id" element={<PlayerDetail />} />
            <Route path="/gallery" element={<Gallery isAdmin={isAdmin} />} />

            <Route path="/match/:id" element={<MatchCentre isAdmin={isAdmin} />} />
            {/* Admin login route */}
            <Route path="/admin-login" element={<AdminLogin setIsAdmin={setIsAdmin} />} />

            <Route
              path="/balances"
              element={
                isAdmin ? (
                  <Balances />
                ) : (
                  <Navigate
                    to="/admin-login"
                    replace
                    state={{ intended: '/balances' }} // 👈 ADD THIS LINE
                  />
                )
              }
            />

            <Route
              path="/player-map"
              element={
                isAdmin ? (
                  <PlayerMap />
                ) : (
                  <Navigate
                    to="/admin-login"
                    replace
                    state={{ intended: '/player-map' }} // 👈 ADD THIS LINE
                  />
                )
              }
            />

            {/* Protected admin routes */}
            <Route
              path="/add-player"
              element={isAdmin ? <AddPlayer /> : <Navigate to="/admin-login" replace />}
            />
            <Route
              path="/edit-player/:id"
              element={isAdmin ? <EditPlayer /> : <Navigate to="/admin-login" replace />}
            />
            <Route
              path="/add-match"
              element={isAdmin ? <AddMatch /> : <Navigate to="/admin-login" replace />}
            />
            <Route
              path="/match/edit/:id"
              element={isAdmin ? <AddMatch /> : <Navigate to="/admin-login" replace />}
            />
            <Route
              path="/add-team"
              element={isAdmin ? <AddTeam /> : <Navigate to="/admin-login" replace />}
            />
            <Route
              path="/add-booking"
              element={isAdmin ? <AddBooking /> : <Navigate to="/admin-login" replace />}
            />
            <Route
              path="/add-news"
              element={isAdmin ? <AddNews /> : <Navigate to="/admin-login" replace />}
            />
            <Route
              path="/add-notification"
              element={isAdmin ? <AdminNotification /> : <Navigate to="/admin-login" replace />}
            />
            <Route
              path="/wc-admin"
              element={
                isAdmin ? <WcAdmin isAdmin={isAdmin} /> : <Navigate to="/admin-login" replace />
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
