// src/components/squad-creator/EditTeamsModal.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCheck } from "react-icons/fa";

interface Player {
  id: number;
  name: string;
  position: string;
  skill?: number;
}

interface EditTeamsModalProps {
  teamA: Player[];
  teamB: Player[];
  editingTeamIndex: number;
  onClose: () => void;
  onSave: (newTeamA: Player[], newTeamB: Player[]) => void;
  isAdmin: boolean;
}

export function EditTeamsModal({
  teamA: initialTeamA,
  teamB: initialTeamB,
  editingTeamIndex,
  onClose,
  onSave,
  isAdmin,
}: EditTeamsModalProps) {
  const [teamA, setTeamA] = useState<Player[]>(initialTeamA);
  const [teamB, setTeamB] = useState<Player[]>(initialTeamB);
  const [draggedPlayer, setDraggedPlayer] = useState<{
    player: Player;
    fromTeam: 0 | 1;
  } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );

  // Calculate total skills
  const skillA = teamA.reduce((sum, p) => sum + (p.skill || 0), 0);
  const skillB = teamB.reduce((sum, p) => sum + (p.skill || 0), 0);
  const skillDiff = Math.abs(skillA - skillB);

  // Handle long press start (for iOS touch)
  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>,
    player: Player,
    fromTeam: 0 | 1,
  ) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });

    longPressTimer.current = setTimeout(() => {
      setDraggedPlayer({ player, fromTeam });
      // Haptic feedback if available
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart || !longPressTimer.current) return;

    const moveX = Math.abs(e.touches[0].clientX - touchStart.x);
    const moveY = Math.abs(e.touches[0].clientY - touchStart.y);

    // If moved too much, cancel long press
    if (moveX > 10 || moveY > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setTouchStart(null);
  };

  // Handle drop on a team
  const handleDropOnTeam = (targetTeam: 0 | 1) => {
    if (!draggedPlayer) return;

    const { player, fromTeam } = draggedPlayer;

    if (fromTeam === targetTeam) {
      setDraggedPlayer(null);
      return;
    }

    // Create new arrays
    const newTeamA = [...teamA];
    const newTeamB = [...teamB];

    // Find and remove player from source
    const sourceArray = fromTeam === 0 ? newTeamA : newTeamB;
    const playerIndex = sourceArray.findIndex((p) => p.id === player.id);

    if (playerIndex === -1) {
      setDraggedPlayer(null);
      return;
    }

    // Remove from source
    sourceArray.splice(playerIndex, 1);

    // Add to target
    if (targetTeam === 0) {
      newTeamA.push(player);
    } else {
      newTeamB.push(player);
    }

    // Update state
    setTeamA(newTeamA);
    setTeamB(newTeamB);
    setDraggedPlayer(null);

    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(30);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setDraggedPlayer(null);
    onClose();
  };

  // Handle save
  const handleSave = () => {
    setDraggedPlayer(null);
    onSave(teamA, teamB);
  };

  // Position color
  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase();
    if (pos === "GOALKEEPER" || pos === "GK")
      return "bg-yellow-500/10 border-yellow-500/30";
    if (pos === "DEFENDER" || pos === "DEF")
      return "bg-blue-500/10 border-blue-500/30";
    if (pos === "MIDFIELDER" || pos === "MID")
      return "bg-green-500/10 border-green-500/30";
    if (pos === "FORWARD" || pos === "FW")
      return "bg-red-500/10 border-red-500/30";
    return "bg-slate-700/30";
  };

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
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="bg-slate-900 border-b border-yellow-500/20 px-4 py-4 flex items-center justify-between"
      >
        <h2 className="text-xl font-black text-yellow-400 flex items-center gap-2">
          ✏️ Edit Teams
        </h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleCancel}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <FaTimes className="text-gray-400 text-xl" />
        </motion.button>
      </motion.div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300"
        >
          <p className="font-semibold mb-1">How to swap players:</p>
          <p>1. Long-press (hold) a player's card</p>
          <p>2. Drag to the other team</p>
          <p>3. Release to drop</p>
        </motion.div>

        {/* Team A */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDropOnTeam(0)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              🔵 Team A
            </h3>
            <div className="text-right">
              <div className="text-xs text-gray-400">Skill</div>
              <div className="text-lg font-bold text-yellow-400">{skillA}</div>
            </div>
          </div>

          {/* Drop Zone Indicator */}
          <div
            className={`min-h-[200px] rounded-lg border-2 border-dashed transition-all p-3 space-y-2 ${
              draggedPlayer?.fromTeam === 1
                ? "border-blue-400 bg-blue-500/10"
                : "border-slate-600 bg-slate-700/20"
            }`}
          >
            <AnimatePresence>
              {teamA.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-gray-400">
                  Drop players here
                </div>
              ) : (
                teamA.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    onTouchStart={(e) => handleTouchStart(e, player, 0)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onDragStart={() =>
                      setDraggedPlayer({ player, fromTeam: 0 })
                    }
                    draggable
                    className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
                      draggedPlayer?.player.id === player.id
                        ? "opacity-50 scale-95 bg-gray-700/50"
                        : getPositionColor(player.position)
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getPositionEmoji(player.position)}</span>
                        <span className="font-semibold text-white">
                          {player.name}
                        </span>
                      </div>
                      {isAdmin && player.skill && (
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-2 bg-slate-600 rounded overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded"
                              style={{ width: `${(player.skill / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-yellow-400 font-bold text-xs">
                            {player.skill}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Team B */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-red-600/10 border border-red-500/30 rounded-xl p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDropOnTeam(1)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              🔴 Team B
            </h3>
            <div className="text-right">
              <div className="text-xs text-gray-400">Skill</div>
              <div className="text-lg font-bold text-yellow-400">{skillB}</div>
            </div>
          </div>

          {/* Drop Zone Indicator */}
          <div
            className={`min-h-[200px] rounded-lg border-2 border-dashed transition-all p-3 space-y-2 ${
              draggedPlayer?.fromTeam === 0
                ? "border-red-400 bg-red-500/10"
                : "border-slate-600 bg-slate-700/20"
            }`}
          >
            <AnimatePresence>
              {teamB.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-gray-400">
                  Drop players here
                </div>
              ) : (
                teamB.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    onTouchStart={(e) => handleTouchStart(e, player, 1)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onDragStart={() =>
                      setDraggedPlayer({ player, fromTeam: 1 })
                    }
                    draggable
                    className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
                      draggedPlayer?.player.id === player.id
                        ? "opacity-50 scale-95 bg-gray-700/50"
                        : getPositionColor(player.position)
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getPositionEmoji(player.position)}</span>
                        <span className="font-semibold text-white">
                          {player.name}
                        </span>
                      </div>
                      {isAdmin && player.skill && (
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-2 bg-slate-600 rounded overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded"
                              style={{ width: `${(player.skill / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-yellow-400 font-bold text-xs">
                            {player.skill}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Balance Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`p-4 rounded-lg border ${
            skillDiff <= 2
              ? "bg-green-500/10 border-green-500/30"
              : "bg-yellow-500/10 border-yellow-500/30"
          }`}
        >
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Skill Balance</p>
            <div className="text-2xl font-black mb-2">
              {skillA} vs {skillB}
            </div>
            <div
              className={`text-sm font-bold ${
                skillDiff <= 2 ? "text-green-400" : "text-yellow-400"
              }`}
            >
              Difference: {skillDiff}{" "}
              {skillDiff <= 2 ? "✓ Balanced" : "⚠️ Unbalanced"}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer - Action Buttons */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-slate-900 border-t border-yellow-500/20 px-4 py-4 space-y-2 flex gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCancel}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 font-bold rounded-xl transition-colors"
        >
          <FaTimes className="inline mr-2" />
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <FaCheck className="text-lg" />
          Save Changes
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
