import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Games from "./pages/Games";
import Squad from "./pages/Squad";
import PlayerDetail from "./pages/PlayerDetail";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import AddPlayer from "./pages/AddPlayer";
import EditPlayer from "./pages/EditPlayer";
import { useState } from "react";
import { AdminLogin } from "./components/AdminLogin";
import { AddMatch } from "./pages/AddMatch"; // create this page/component
import MatchCentre from "./pages/MatchCentre";
import { LeagueStandings } from "./pages/LeagueStandings";
import { AddTeam } from "./pages/AddTeam";
import AddBooking from "./pages/AddBooking";
import AdminNotification from "./pages/AdminNotificationPage";

function App() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    });
  }

  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem("isAdmin") === "true"
  );

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value);
    if (value) {
      localStorage.setItem("isAdmin", "true");
    } else {
      localStorage.removeItem("isAdmin");
    }
  };
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Header isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
        <Routes>
          <Route path="/" element={<Home isAdmin={isAdmin} />} />
          <Route path="/games" element={<Games />} />
          <Route path="/standings" element={<LeagueStandings />} />
          <Route path="/squad" element={<Squad isAdmin={isAdmin} />} />
          <Route path="/player/:id" element={<PlayerDetail />} />
          <Route path="/gallery" element={<Gallery isAdmin={isAdmin} />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/match/:id"
            element={<MatchCentre isAdmin={isAdmin} />}
          />
          {/* Admin login route */}
          <Route
            path="/admin-login"
            element={<AdminLogin setIsAdmin={setIsAdmin} />}
          />

          {/* Protected admin routes */}
          <Route
            path="/add-player"
            element={
              isAdmin ? <AddPlayer /> : <Navigate to="/admin-login" replace />
            }
          />
          <Route
            path="/edit-player/:id"
            element={
              isAdmin ? <EditPlayer /> : <Navigate to="/admin-login" replace />
            }
          />
          <Route
            path="/add-match"
            element={
              isAdmin ? <AddMatch /> : <Navigate to="/admin-login" replace />
            }
          />
          <Route
            path="/match/edit/:id"
            element={
              isAdmin ? <AddMatch /> : <Navigate to="/admin-login" replace />
            }
          />
          <Route
            path="/add-team"
            element={
              isAdmin ? <AddTeam /> : <Navigate to="/admin-login" replace />
            }
          />
          <Route
            path="/add-booking"
            element={
              isAdmin ? <AddBooking /> : <Navigate to="/admin-login" replace />
            }
          />
          <Route
            path="/add-notification"
            element={
              isAdmin ? (
                <AdminNotification />
              ) : (
                <Navigate to="/admin-login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
