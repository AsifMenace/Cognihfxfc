// src/components/squad-creator/MatchLinkingModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaArrowRight, FaCheck } from 'react-icons/fa';

interface Player {
  id: number;
  name: string;
  position: string;
  skill?: number;
}

interface Match {
  id: number;
  date: string;
  time: string;
  venue: string;
  competition: string;
  homeTeam: {
    id: number;
    name: string;
    color: string;
  };
  awayTeam: {
    id: number;
    name: string;
    color: string;
  };
  displayName: string;
  hasLinkedSquad: boolean;
}

interface MatchLinkingModalProps {
  squadId: number;
  teamA: Player[];
  teamB: Player[];
  onClose: () => void;
  onSuccess: () => void;
}

export function MatchLinkingModal({
  squadId,
  teamA,
  teamB,
  onClose,
  onSuccess,
}: MatchLinkingModalProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [teamAAssignment, setTeamAAssignment] = useState<string | null>(null);
  const [teamBAssignment, setTeamBAssignment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fetch upcoming matches
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch('/.netlify/functions/getUpcomingMatches');
        const data = await response.json();

        if (data.success) {
          setMatches(data.matches);
          if (data.nextMatch) {
            setSelectedMatch(data.nextMatch);
          }
        } else {
          setError('Failed to load matches');
        }
      } catch (err) {
        setError('Failed to load matches');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // When match is selected, auto-assign teams if possible
  useEffect(() => {
    if (selectedMatch && !teamAAssignment && !teamBAssignment) {
      setTeamAAssignment(selectedMatch.homeTeam.name);
      setTeamBAssignment(selectedMatch.awayTeam.name);
    }
  }, [selectedMatch]);

  // Handle team swap
  const handleSwapTeams = () => {
    const temp = teamAAssignment;
    setTeamAAssignment(teamBAssignment);
    setTeamBAssignment(temp);
  };

  // Handle link squads
  const handleLinkSquads = async () => {
    if (!selectedMatch || !teamAAssignment || !teamBAssignment) {
      setError('Please select a match and assign teams');
      return;
    }

    if (teamAAssignment === teamBAssignment) {
      setError('Teams must be assigned to different matches');
      return;
    }

    setLinking(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/linkSquadToMatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          squadId,
          matchId: selectedMatch.id,
          teamAAssignedTo: teamAAssignment,
          teamBAssignedTo: teamBAssignment,
          teamA,
          teamB,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to link squad');
      }

      setShowConfirmation(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link squad');
    } finally {
      setLinking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col justify-end"
    >
      {/* Bottom Sheet Modal */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-slate-900 rounded-t-3xl max-h-[90vh] overflow-y-auto w-full flex flex-col border-t border-yellow-500/20"
      >
        {/* Handle Bar & Header */}
        <div className="px-4 pt-3 pb-4 flex flex-col items-center sticky top-0 bg-slate-900 border-b border-slate-800/50">
          <div className="w-12 h-1 bg-slate-600 rounded-full mb-4" />
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-black text-yellow-400 flex items-center gap-2">
              🔗 Link to Match
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FaTimes className="text-gray-400 text-lg" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {showConfirmation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/20 border border-green-500 rounded-lg p-4 text-center"
              >
                <div className="text-3xl mb-2">✅</div>
                <p className="text-green-300 font-bold">Squad linked successfully!</p>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-3 border-yellow-400 border-t-transparent rounded-full mb-3" />
              <p className="text-gray-400">Loading upcoming matches...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No upcoming matches found</p>
            </div>
          ) : (
            <>
              {/* Upcoming Matches List */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                <h3 className="font-bold text-gray-400 text-sm px-2">Upcoming Matches</h3>
                <div className="space-y-2">
                  {matches.map((match, index) => (
                    <motion.button
                      key={match.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedMatch(match);
                        setTeamAAssignment(match.homeTeam.name);
                        setTeamBAssignment(match.awayTeam.name);
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedMatch?.id === match.id
                          ? 'bg-yellow-500/10 border-yellow-500/50'
                          : 'bg-slate-800/50 border-slate-700/50 hover:border-yellow-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{match.displayName}</span>
                          {match.hasLinkedSquad && (
                            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                              Linked
                            </span>
                          )}
                        </div>
                        {selectedMatch?.id === match.id && (
                          <FaCheck className="text-yellow-400" />
                        )}
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p>📅 {new Date(match.date).toLocaleDateString()} • ⏰ {match.time}</p>
                        <p>📍 {match.venue}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Team Assignment Section */}
              {selectedMatch && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-4 mt-6"
                >
                  <h3 className="font-bold text-gray-400 text-sm">Assign Teams</h3>

                  {/* Team A Assignment */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Squad Team A</label>
                    <div className="space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTeamAAssignment(selectedMatch.homeTeam.name)}
                        className={`w-full p-3 rounded-lg border-2 text-left font-semibold transition-all flex items-center justify-between ${
                          teamAAssignment === selectedMatch.homeTeam.name
                            ? 'bg-blue-500/10 border-blue-500/50'
                            : 'bg-slate-700/30 border-slate-600/30 hover:border-blue-500/30'
                        }`}
                      >
                        <span className="text-white">{selectedMatch.homeTeam.name} (Home)</span>
                        {teamAAssignment === selectedMatch.homeTeam.name && (
                          <FaCheck className="text-blue-400" />
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTeamAAssignment(selectedMatch.awayTeam.name)}
                        className={`w-full p-3 rounded-lg border-2 text-left font-semibold transition-all flex items-center justify-between ${
                          teamAAssignment === selectedMatch.awayTeam.name
                            ? 'bg-red-500/10 border-red-500/50'
                            : 'bg-slate-700/30 border-slate-600/30 hover:border-red-500/30'
                        }`}
                      >
                        <span className="text-white">{selectedMatch.awayTeam.name} (Away)</span>
                        {teamAAssignment === selectedMatch.awayTeam.name && (
                          <FaCheck className="text-red-400" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSwapTeams}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FaArrowRight className="rotate-90" />
                    Swap Teams
                  </motion.button>

                  {/* Team B Assignment */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Squad Team B</label>
                    <div className="space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTeamBAssignment(selectedMatch.homeTeam.name)}
                        className={`w-full p-3 rounded-lg border-2 text-left font-semibold transition-all flex items-center justify-between ${
                          teamBAssignment === selectedMatch.homeTeam.name
                            ? 'bg-blue-500/10 border-blue-500/50'
                            : 'bg-slate-700/30 border-slate-600/30 hover:border-blue-500/30'
                        }`}
                      >
                        <span className="text-white">{selectedMatch.homeTeam.name} (Home)</span>
                        {teamBAssignment === selectedMatch.homeTeam.name && (
                          <FaCheck className="text-blue-400" />
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTeamBAssignment(selectedMatch.awayTeam.name)}
                        className={`w-full p-3 rounded-lg border-2 text-left font-semibold transition-all flex items-center justify-between ${
                          teamBAssignment === selectedMatch.awayTeam.name
                            ? 'bg-red-500/10 border-red-500/50'
                            : 'bg-slate-700/30 border-slate-600/30 hover:border-red-500/30'
                        }`}
                      >
                        <span className="text-white">{selectedMatch.awayTeam.name} (Away)</span>
                        {teamBAssignment === selectedMatch.awayTeam.name && (
                          <FaCheck className="text-red-400" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Summary */}
                  {teamAAssignment && teamBAssignment && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300"
                    >
                      <p className="font-semibold mb-2">Summary:</p>
                      <p>Team A → {teamAAssignment}</p>
                      <p>Team B → {teamBAssignment}</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Footer - Link Button */}
        {!showConfirmation && (
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-slate-900 border-t border-slate-800 px-4 py-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLinkSquads}
              disabled={
                !selectedMatch || !teamAAssignment || !teamBAssignment || linking
              }
              className={`w-full py-4 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-lg ${
                selectedMatch && teamAAssignment && teamBAssignment && !linking
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                  : 'bg-slate-700 text-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              {linking ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Linking...
                </>
              ) : (
                <>
                  <FaCheck className="text-lg" />
                  Link Squad to Match
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
