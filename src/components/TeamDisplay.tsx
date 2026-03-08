// src/components/squad-creator/TeamDisplay.tsx
import { motion } from 'framer-motion';
import { FaEdit, FaSave, FaLink } from 'react-icons/fa';

interface Player {
  id: number;
  name: string;
  position: string;
  skill?: number;
}

interface TeamDisplayProps {
  team: Player[];
  teamName: string;
  teamColor: string;
  teamIcon: string;
  onEdit: () => void;
  onSave: () => void;
  onLink: () => void;
  isSaving: boolean;
  isSaved: boolean;
  hideAction?: boolean;
}

export function TeamDisplay({
  team,
  teamName,
  teamColor,
  teamIcon,
  onEdit,
  onSave,
  onLink,
  isSaving,
  isSaved,
  hideAction = false,
}: TeamDisplayProps) {
  // Calculate total skill
  const totalSkill = team.reduce((sum, p) => sum + (p.skill || 0), 0);

  // Group players by position
  const playersByPosition = {
    GK: team.filter(p => p.position?.toUpperCase() === 'GOALKEEPER' || p.position?.toUpperCase() === 'GK'),
    DEF: team.filter(p => p.position?.toUpperCase() === 'DEFENDER' || p.position?.toUpperCase() === 'DEF'),
    MID: team.filter(p => p.position?.toUpperCase() === 'MIDFIELDER' || p.position?.toUpperCase() === 'MID'),
    FW: team.filter(p => p.position?.toUpperCase() === 'FORWARD' || p.position?.toUpperCase() === 'FW'),
  };

  // Get position color
  const getPositionBgColor = (position: string) => {
    const pos = position.toUpperCase();
    if (pos === 'GOALKEEPER' || pos === 'GK') return 'bg-yellow-500/10 border-yellow-500/30';
    if (pos === 'DEFENDER' || pos === 'DEF') return 'bg-blue-500/10 border-blue-500/30';
    if (pos === 'MIDFIELDER' || pos === 'MID') return 'bg-green-500/10 border-green-500/30';
    if (pos === 'FORWARD' || pos === 'FW') return 'bg-red-500/10 border-red-500/30';
    return 'bg-slate-700/30';
  };

  const getPositionTextColor = (position: string) => {
    const pos = position.toUpperCase();
    if (pos === 'GOALKEEPER' || pos === 'GK') return 'text-yellow-400';
    if (pos === 'DEFENDER' || pos === 'DEF') return 'text-blue-400';
    if (pos === 'MIDFIELDER' || pos === 'MID') return 'text-green-400';
    if (pos === 'FORWARD' || pos === 'FW') return 'text-red-400';
    return 'text-gray-400';
  };

  const getPositionEmoji = (position: string) => {
    const pos = position.toUpperCase();
    if (pos === 'GOALKEEPER' || pos === 'GK') return '⚽';
    if (pos === 'DEFENDER' || pos === 'DEF') return '🛡️';
    if (pos === 'MIDFIELDER' || pos === 'MID') return '🔄';
    if (pos === 'FORWARD' || pos === 'FW') return '⚡';
    return '👤';
  };

  const positionLabels = {
    GK: 'Goalkeeper',
    DEF: 'Defenders',
    MID: 'Midfielders',
    FW: 'Forwards',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${teamColor} bg-opacity-10 backdrop-blur-sm border border-opacity-30 rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden`}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <span className="text-3xl">{teamIcon}</span>
            {teamName}
          </h2>
          <div className="text-right">
            <div className="text-sm text-gray-400">Total Skill</div>
            <div className="text-2xl sm:text-3xl font-black text-yellow-400">{totalSkill}</div>
          </div>
        </div>

        {/* Position Breakdown */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
          <div className="bg-yellow-500/10 rounded-lg p-2">
            <div className="text-yellow-400 font-bold">{playersByPosition.GK.length}</div>
            <div className="text-gray-400 text-xs">GK</div>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-2">
            <div className="text-blue-400 font-bold">{playersByPosition.DEF.length}</div>
            <div className="text-gray-400 text-xs">DEF</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-2">
            <div className="text-green-400 font-bold">{playersByPosition.MID.length}</div>
            <div className="text-gray-400 text-xs">MID</div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-2">
            <div className="text-red-400 font-bold">{playersByPosition.FW.length}</div>
            <div className="text-gray-400 text-xs">FW</div>
          </div>
        </div>
      </div>

      {/* Players by Position */}
      <div className="space-y-4 mb-6">
        {(['GK', 'DEF', 'MID', 'FW'] as const).map(pos => {
          if (playersByPosition[pos].length === 0) return null;

          return (
            <motion.div
              key={pos}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* Position Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{getPositionEmoji(pos)}</span>
                <h3 className={`font-bold text-sm sm:text-base ${getPositionTextColor(pos)}`}>
                  {positionLabels[pos]} ({playersByPosition[pos].length})
                </h3>
              </div>

              {/* Players in Position */}
              <div className="space-y-2 pl-6">
                {playersByPosition[pos].map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border ${getPositionBgColor(pos)} flex items-center justify-between`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm sm:text-base">{player.name}</p>
                    </div>
                    {player.skill && (
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <span className="text-yellow-400 font-bold text-sm">S:{player.skill}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons */}
      {!hideAction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          {/* Edit Teams Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEdit}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <FaEdit className="text-lg" />
            Edit Teams
          </motion.button>

          {/* Save Squad Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSave}
            disabled={isSaving}
            className={`w-full py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
              isSaved
                ? 'bg-green-600/50 text-green-300 hover:bg-green-600/60'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <FaSave className="text-lg" />
                Squad Saved ✓
              </>
            ) : (
              <>
                <FaSave className="text-lg" />
                Save Squad
              </>
            )}
          </motion.button>

          {/* Link to Match Button */}
          {isSaved && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLink}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <FaLink className="text-lg" />
              Link to Match
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
