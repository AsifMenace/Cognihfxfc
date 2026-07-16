// src/components/squad-creator/SquadHistory.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHistory, FaTrash, FaEye, FaChevronDown, FaChevronUp, FaShareAlt } from 'react-icons/fa';
import { toPng } from 'html-to-image';

interface Player {
  id: number;
  name: string;
  position: string;
  skill?: number;
  runner?: boolean;
}

interface Squad {
  id: number;
  generationDate: string;
  teamA: Player[];
  teamB: Player[];
  teamC?: Player[] | null;
  teamATotalSkill: number;
  teamBTotalSkill: number;
  teamCTotalSkill?: number | null;
  teamAFWSkill?: number;
  teamBFWSkill?: number;
  status: string;
  matchId?: number | null;
  createdAt?: string;
}

interface SquadHistoryProps {
  isAdmin: boolean;
  onLoadSquad: (squad: Squad) => void;
  squadMode: '2squad' | '3squad';
}

export function SquadHistory({ isAdmin, onLoadSquad, squadMode }: SquadHistoryProps) {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSquadId, setExpandedSquadId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [sharing, setSharing] = useState<number | null>(null);
  const shareRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Fetch squad history from database (last 4 days) abc
  useEffect(() => {
    const fetchSquadHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/.netlify/functions/getSquadHistory');

        if (!response.ok) {
          throw new Error('Failed to fetch squad history');
        }

        const data = await response.json();

        if (data.success && data.squads) {
          const filtered = data.squads.filter((s: Squad) =>
            squadMode === '3squad' ? !!s.teamC : !s.teamC
          );
          setSquads(filtered);
        } else {
          setError('Failed to load squad history');
        }
      } catch (err) {
        setError('Failed to load squad history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSquadHistory();
  }, []);

  // Delete squad
  const handleDeleteSquad = async (squadId: number) => {
    if (!window.confirm('Are you sure you want to delete this squad?')) return;

    setDeleting(squadId);
    try {
      // Remove from local state
      setSquads(squads.filter((s) => s.id !== squadId));
      // TODO: Call backend delete endpoint if you create one
    } catch (err) {
      console.error('Error deleting squad:', err);
      alert('Failed to delete squad');
    } finally {
      setDeleting(null);
    }
  };

  // Share squad as image
  const handleShareSquad = async (squad: Squad) => {
    const el = shareRefs.current[squad.id];
    if (!el) return;
    setSharing(squad.id);
    try {
      const dataUrl = await toPng(el, { backgroundColor: '#0f172a', pixelRatio: 2 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `squad-${squad.id}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Squad' });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `squad-${squad.id}.png`;
        a.click();
      }
    } catch (err) {
      console.error('Share failed', err);
    } finally {
      setSharing(null);
    }
  };

  // Load squad
  const handleLoadSquad = (squad: Squad) => {
    onLoadSquad(squad);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPositionEmoji = (position: string) => {
    const pos = position.toUpperCase();
    if (pos === 'GOALKEEPER' || pos === 'GK') return '🧤';
    if (pos === 'DEFENDER' || pos === 'DEF') return '💪';
    if (pos === 'MIDFIELDER' || pos === 'MID') return '⚙️';
    if (pos === 'FORWARD' || pos === 'FW') return '🚀';
    return '👤';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'linked':
        return 'bg-green-500/20 text-green-300';
      case 'edited':
        return 'bg-blue-500/20 text-blue-300';
      case 'played':
        return 'bg-purple-500/20 text-purple-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'linked':
        return '🔗 Linked to Match';
      case 'edited':
        return '✏️ Edited';
      case 'played':
        return '✅ Played';
      default:
        return '📝 Created';
    }
  };

  // Sort players by position order: GK, DEF, MID, FW
  const sortPlayersByPosition = (players: Player[]) => {
    const positionOrder: { [key: string]: number } = {
      goalkeeper: 0,
      gk: 0,
      defender: 1,
      def: 1,
      midfielder: 2,
      mid: 2,
      forward: 3,
      fw: 3,
    };

    return [...players].sort((a, b) => {
      const posA = positionOrder[a.position.toLowerCase()] ?? 99;
      const posB = positionOrder[b.position.toLowerCase()] ?? 99;
      return posA - posB;
    });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-800/50 rounded-2xl border border-yellow-500/20 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <FaHistory className="text-yellow-400 text-xl" />
          <h2 className="text-xl font-black text-yellow-400">Squad History (Last 4 Days)</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-3 border-yellow-400 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-400 mt-3">Loading squad history...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-500/10 rounded-2xl border border-red-500/30 p-6"
      >
        <p className="text-red-300 font-semibold">{error}</p>
      </motion.div>
    );
  }

  if (squads.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-800/50 rounded-2xl border border-yellow-500/20 p-6 text-center"
      >
        <FaHistory className="text-4xl text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400 font-semibold">No squad history in the last 4 days</p>
        <p className="text-sm text-gray-500">Generate and save a squad to see it here!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-2xl border border-yellow-500/20 p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FaHistory className="text-yellow-400 text-xl" />
        <h2 className="text-xl font-black text-yellow-400">Squad History (Last 4 Days)</h2>
        <span className="ml-auto bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-bold">
          {squads.length} Squad{squads.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Squads List */}
      <div className="space-y-3">
        <AnimatePresence>
          {squads.map((squad, index) => (
            <motion.div
              key={squad.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-700/50 border border-slate-600/50 rounded-lg overflow-hidden hover:border-yellow-500/30 transition-all"
            >
              {/* Squad Summary */}
              <button
                onClick={() => setExpandedSquadId(expandedSquadId === squad.id ? null : squad.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-700/70 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-zinc-100 text-2xl">
                      {squad.teamC
                        ? `${squad.teamA.length}v${squad.teamB.length}v${squad.teamC.length}`
                        : `${squad.teamA.length}v${squad.teamB.length}`}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-yellow-400 font-bold">
                        {squad.teamC
                          ? `${squad.teamATotalSkill} · ${squad.teamBTotalSkill} · ${squad.teamCTotalSkill}`
                          : `${squad.teamATotalSkill} vs ${squad.teamBTotalSkill}`}
                      </span>
                      {!squad.teamC && Math.abs(squad.teamATotalSkill - squad.teamBTotalSkill) <= 2 && (
                        <span className="text-green-400 text-sm">✓ Balanced</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">
                      {new Date(squad.generationDate).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(squad.status)}`}
                    >
                      {getStatusLabel(squad.status)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadSquad(squad);
                    }}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Load squad"
                  >
                    <FaEye className="text-sm" />
                  </motion.button>

                  {isAdmin && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSquad(squad.id);
                      }}
                      disabled={deleting === squad.id}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      title="Delete squad"
                    >
                      {deleting === squad.id ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <FaTrash className="text-sm" />
                      )}
                    </motion.button>
                  )}

                  <span className="text-gray-400 text-lg">
                    {expandedSquadId === squad.id ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </div>
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedSquadId === squad.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-600/50 bg-slate-700/30 p-4 space-y-3"
                  >
                    {/* Card captured for sharing — ref attached here */}
                    <div
                      ref={(el) => { shareRefs.current[squad.id] = el; }}
                      className="bg-slate-900 rounded-xl p-4 space-y-3"
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                        <span className="text-yellow-400 font-black text-sm tracking-wide">⚽ SQUAD</span>
                        <span className="text-gray-400 text-xs">
                          {new Date(squad.generationDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {squad.teamC ? (
                        /* 3-squad: stacked on mobile, 3 columns on sm+ */
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { label: '🔵 Squad A', players: squad.teamA, color: 'text-blue-300' },
                            { label: '🔴 Squad B', players: squad.teamB, color: 'text-red-300' },
                            { label: '🟢 Squad C', players: squad.teamC, color: 'text-green-300' },
                          ].map(({ label, players, color }) => (
                            <div key={label}>
                              <h4 className={`font-bold ${color} mb-2 text-sm`}>{label}</h4>
                              <div className="space-y-1">
                                {sortPlayersByPosition(players).map((player) => (
                                  <div
                                    key={player.id}
                                    className="flex items-center justify-between p-1.5 bg-slate-800 rounded text-xs"
                                  >
                                    <div className="flex items-center gap-1 min-w-0">
                                      <span>{getPositionEmoji(player.position)}</span>
                                      <span className="text-gray-300 truncate">{player.name}</span>
                                      {player.runner && <span className="text-sm flex-shrink-0">🏃</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* 2-squad: side by side */
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: '🔵 Team A', players: squad.teamA, color: 'text-blue-300' },
                            { label: '🔴 Team B', players: squad.teamB, color: 'text-red-300' },
                          ].map(({ label, players, color }) => (
                            <div key={label}>
                              <h4 className={`font-bold ${color} mb-2 text-sm`}>{label}</h4>
                              <div className="space-y-1">
                                {sortPlayersByPosition(players).map((player) => (
                                  <div
                                    key={player.id}
                                    className="flex items-center justify-between p-1.5 bg-slate-800 rounded text-xs"
                                  >
                                    <div className="flex items-center gap-1 min-w-0">
                                      <span>{getPositionEmoji(player.position)}</span>
                                      <span className="text-gray-300 truncate">{player.name}</span>
                                      {player.runner && <span className="text-sm flex-shrink-0">🏃</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Share button — outside the capture div */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleShareSquad(squad)}
                      disabled={sharing === squad.id}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      {sharing === squad.id ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          <FaShareAlt />
                          Share Squads
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
