// src/components/squad-creator/SquadCreatorWidget.tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaFire, FaArrowRight } from 'react-icons/fa';

interface Player {
  id: number;
  name: string;
  position: string;
  skill?: number;
}

interface Squad {
  id: number;
  generationDate: string;
  teamA: Player[];
  teamB: Player[];
  teamATotalSkill: number;
  teamBTotalSkill: number;
}

export function SquadCreatorWidget() {
  const [lastSquad, setLastSquad] = useState<Squad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch from an API
    // For now, we'll check localStorage
    const stored = localStorage.getItem('lastSquad');
    if (stored) {
      try {
        setLastSquad(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse stored squad:', error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return null;
  }

  if (!lastSquad) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-yellow-600/10 to-orange-600/10 border border-yellow-500/20 rounded-2xl p-4 sm:p-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <FaFire className="text-orange-500 text-2xl" />
          <h3 className="text-lg sm:text-xl font-black text-yellow-400">Squad Creator</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Create perfectly balanced squads for your matches with our AI-powered generator.
        </p>
        <Link
          to="/squad-creator"
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors text-sm"
        >
          Create Squad
          <FaArrowRight className="text-xs" />
        </Link>
      </motion.div>
    );
  }

  const getPositionEmoji = (position: string) => {
    const pos = position.toUpperCase();
    if (pos === 'GOALKEEPER' || pos === 'GK') return '⚽';
    if (pos === 'DEFENDER' || pos === 'DEF') return '🛡️';
    if (pos === 'MIDFIELDER' || pos === 'MID') return '🔄';
    if (pos === 'FORWARD' || pos === 'FW') return '⚡';
    return '👤';
  };

  // Get first 3 players from each team
  const teamAPreview = lastSquad.teamA.slice(0, 3);
  const teamBPreview = lastSquad.teamB.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-yellow-500/20 rounded-2xl p-4 sm:p-6 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FaFire className="text-orange-500 text-xl sm:text-2xl" />
          <h3 className="text-lg sm:text-xl font-black text-yellow-400">Last Squad Generated</h3>
        </div>
        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
          {new Date(lastSquad.generationDate).toLocaleDateString()}
        </span>
      </div>

      {/* Teams Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Team A */}
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-white text-sm">🔵 Team A</h4>
            <span className="text-yellow-400 font-bold text-sm">{lastSquad.teamATotalSkill}</span>
          </div>
          <div className="space-y-1">
            {teamAPreview.map(player => (
              <div key={player.id} className="text-xs text-gray-300 flex items-center gap-1">
                <span>{getPositionEmoji(player.position)}</span>
                <span>{player.name.substring(0, 12)}</span>
              </div>
            ))}
            {lastSquad.teamA.length > 3 && (
              <div className="text-xs text-gray-500">+{lastSquad.teamA.length - 3} more</div>
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-white text-sm">🔴 Team B</h4>
            <span className="text-yellow-400 font-bold text-sm">{lastSquad.teamBTotalSkill}</span>
          </div>
          <div className="space-y-1">
            {teamBPreview.map(player => (
              <div key={player.id} className="text-xs text-gray-300 flex items-center gap-1">
                <span>{getPositionEmoji(player.position)}</span>
                <span>{player.name.substring(0, 12)}</span>
              </div>
            ))}
            {lastSquad.teamB.length > 3 && (
              <div className="text-xs text-gray-500">+{lastSquad.teamB.length - 3} more</div>
            )}
          </div>
        </div>
      </div>

      {/* Balance Info */}
      <div className="bg-slate-700/50 rounded-lg p-3 mb-4 text-center text-sm">
        <p className="text-gray-400">
          Skill Balance:{' '}
          <span className="font-bold text-yellow-400">
            {lastSquad.teamATotalSkill} vs {lastSquad.teamBTotalSkill}
          </span>
          {Math.abs(lastSquad.teamATotalSkill - lastSquad.teamBTotalSkill) <= 2 && (
            <span className="text-green-400 ml-2">✓ Balanced</span>
          )}
        </p>
      </div>

      {/* Action Button */}
      <Link
        to="/squad-creator"
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors text-sm"
      >
        View Full Squad
        <FaArrowRight className="text-xs" />
      </Link>
    </motion.div>
  );
}
