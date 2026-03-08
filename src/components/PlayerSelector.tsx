// src/components/squad-creator/PlayerSelector.tsx
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaFire, FaCheck } from "react-icons/fa";

interface Player {
  id: number;
  name: string;
  position: string;
  skill?: number;
}

interface PlayerSelectorProps {
  allPlayers: Player[];
  selectedPlayerIds: number[];
  onPlayerToggle: (playerId: number) => void;
  isLoading: boolean;
  onGenerate: () => void;
  isAdmin: boolean;
}

export function PlayerSelector({
  allPlayers,
  selectedPlayerIds,
  onPlayerToggle,
  isLoading,
  onGenerate,
  isAdmin,
}: PlayerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const selectedCount = selectedPlayerIds.length;
  const isComplete = selectedCount === 14 || selectedCount === 16;

  // Filter players based on search
  const filteredPlayers = useMemo(() => {
    return allPlayers.filter(
      (player) =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.position.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allPlayers, searchQuery]);

  // Get position color
  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase();
    if (pos === "GOALKEEPER" || pos === "GK") return "text-yellow-400";
    if (pos === "DEFENDER" || pos === "DEF") return "text-blue-400";
    if (pos === "MIDFIELDER" || pos === "MID") return "text-green-400";
    if (pos === "FORWARD" || pos === "FW") return "text-red-400";
    return "text-gray-400";
  };

  // Get position emoji
  const getPositionEmoji = (position: string) => {
    const pos = position.toUpperCase();
    if (pos === "GOALKEEPER" || pos === "GK") return "⚽";
    if (pos === "DEFENDER" || pos === "DEF") return "🛡️";
    if (pos === "MIDFIELDER" || pos === "MID") return "🔄";
    if (pos === "FORWARD" || pos === "FW") return "⚡";
    return "👤";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 shadow-2xl p-4 sm:p-6 w-full"
    >
      {/* Selection Counter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-yellow-400">Select Players</h2>
          <div
            className={`text-sm font-semibold px-3 py-1 rounded-full ${
              isComplete
                ? "bg-green-500/20 text-green-300"
                : "bg-yellow-500/20 text-yellow-300"
            }`}
          >
            {selectedCount}/14-16
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((selectedCount / 16) * 100, 100)}%` }}
            className={`h-full ${
              isComplete ? "bg-green-500" : "bg-yellow-500"
            }`}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {selectedCount === 0
            ? "Select 14 players for 7v7 or 16 for 8v8"
            : selectedCount < 14
              ? `Need ${14 - selectedCount} more players for 7v7`
              : selectedCount === 14
                ? "Ready to generate! (or select 2 more for 8v8)"
                : selectedCount === 15
                  ? "Need 1 more player for 8v8"
                  : "Ready to generate 8v8!"}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <FaSearch className="absolute left-3 top-3.5 text-gray-500 text-sm" />
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
        />
      </div>

      {/* Player List */}
      <div className="max-h-96 sm:max-h-[500px] overflow-y-auto space-y-2 mb-4">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No players found</p>
          </div>
        ) : (
          filteredPlayers.map((player, index) => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const isDisabled = !isSelected && selectedPlayerIds.length >= 16;

            return (
              <motion.button
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => onPlayerToggle(player.id)}
                disabled={isDisabled}
                className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 text-left group ${
                  isSelected
                    ? "bg-yellow-500/10 border-yellow-500/50 hover:border-yellow-500"
                    : isDisabled
                      ? "bg-slate-700/30 border-slate-600/30 cursor-not-allowed opacity-50"
                      : "bg-slate-700/30 border-slate-600/30 hover:border-yellow-500/50 hover:bg-slate-700/50"
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? "bg-yellow-500 border-yellow-500"
                      : "border-gray-500 group-hover:border-yellow-500"
                  }`}
                >
                  {isSelected && <FaCheck className="text-slate-900 text-xs" />}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">
                    {player.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">
                      {getPositionEmoji(player.position)}
                    </span>
                    <span className={getPositionColor(player.position)}>
                      {player.position}
                    </span>
                  </div>
                </div>

                {/* Skill (Admin only) */}
                {isAdmin && player.skill && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <FaFire className="text-orange-500 text-xs" />
                    <span className="text-yellow-400 font-bold text-sm">
                      {player.skill}
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })
        )}
      </div>

      {/* Generate Button */}
      <motion.button
        whileHover={isComplete && !isLoading ? { scale: 1.02 } : {}}
        whileTap={isComplete && !isLoading ? { scale: 0.98 } : {}}
        onClick={onGenerate}
        disabled={!isComplete || isLoading}
        className={`w-full py-4 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 ${
          isComplete && !isLoading
            ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-slate-900"
            : "bg-slate-700 text-gray-400 cursor-not-allowed opacity-50"
        }`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            Generating...
          </>
        ) : (
          <>
            <FaFire className="text-lg" />
            Generate Balanced Squads
          </>
        )}
      </motion.button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center mt-3">
        The algorithm will generate perfectly balanced teams based on skills and
        positions
      </p>
    </motion.div>
  );
}
