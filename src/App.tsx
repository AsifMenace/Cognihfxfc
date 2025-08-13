import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Games from './pages/Games';
import Squad from './pages/Squad';
import PlayerDetail from './pages/PlayerDetail';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import AddPlayer from './pages/AddPlayer';
import EditPlayer from './pages/EditPlayer';


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<Games />} />
          <Route path="/squad" element={<Squad />} />
          <Route path="/player/:id" element={<PlayerDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/add-player" element={<AddPlayer />} />
          <Route path="/edit-player/:id" element={<EditPlayer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;