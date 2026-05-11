// src/components/squad-creator/EditTeamsModal.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCheck } from "react-icons/fa";

interface Player {
  id: number;
  name: string;
  position: string;
  skill?: number;
}

type Pair = "AB" | "BC" | "AC";

interface EditTeamsModalProps {
  teamA: Player[];
  teamB: Player[];
  teamC?: Player[];
  editingTeamIndex: number;
  onClose: () => void;
  onSave: (newTeamA: Player[], newTeamB: Player[], newTeamC?: Player[]) => void;
  isAdmin: boolean;
}

function getPositionColor(position: string) {
  const pos = position.toUpperCase();
  if (pos === "GOALKEEPER" || pos === "GK") return "bg-yellow-500/10 border-yellow-500/30";
  if (pos === "DEFENDER" || pos === "DEF") return "bg-blue-500/10 border-blue-500/30";
  if (pos === "MIDFIELDER" || pos === "MID") return "bg-green-500/10 border-green-500/30";
  if (pos === "FORWARD" || pos === "FW") return "bg-red-500/10 border-red-500/30";
  return "bg-slate-700/30";
}

function getPositionEmoji(position: string) {
  const pos = position.toUpperCase();
  if (pos === "GOALKEEPER" || pos === "GK") return "⚽";
  if (pos === "DEFENDER" || pos === "DEF") return "🛡️";
  if (pos === "MIDFIELDER" || pos === "MID") return "🔄";
  if (pos === "FORWARD" || pos === "FW") return "⚡";
  return "👤";
}

function totalSkill(players: Player[]) {
  return players.reduce((sum, p) => sum + (p.skill || 0), 0);
}

interface TeamColumnProps {
  label: string;
  icon: string;
  borderColor: string;
  highlightColor: string;
  players: Player[];
  selectedPlayer: { player: Player; fromIndex: number } | null;
  teamIndex: number;
  onPlayerClick: (player: Player, teamIndex: number) => void;
  isAdmin: boolean;
}

function TeamColumn({
  label,
  icon,
  borderColor,
  highlightColor,
  players,
  selectedPlayer,
  teamIndex,
  onPlayerClick,
  isAdmin,
}: TeamColumnProps) {
  const skill = totalSkill(players);
  const isDropTarget = selectedPlayer !== null && selectedPlayer.fromIndex !== teamIndex;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 border ${borderColor} bg-opacity-10`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>{icon}</span> {label}
        </h3>
        <div className="text-right">
          <div className="text-xs text-gray-400">Skill</div>
          <div className="text-lg font-bold text-yellow-400">{skill}</div>
        </div>
      </div>

      <div
        className={`min-h-[180px] rounded-lg border-2 border-dashed transition-all p-2 space-y-2 ${
          isDropTarget ? highlightColor : "border-slate-600 bg-slate-700/20"
        }`}
      >
        <AnimatePresence>
          {players.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-gray-400 text-sm">
              No players
            </div>
          ) : (
            players.map((player, index) => {
              const isSelected =
                selectedPlayer?.player.id === player.id &&
                selectedPlayer?.fromIndex === teamIndex;
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => onPlayerClick(player, teamIndex)}
                  className={`p-2 rounded-lg border cursor-pointer transition-all select-none text-sm ${
                    isSelected
                      ? "bg-yellow-500/30 border-yellow-400 ring-2 ring-yellow-400 scale-105"
                      : getPositionColor(player.position)
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-xs">{getPositionEmoji(player.position)}</span>
                      <span className="font-semibold text-white truncate">{player.name}</span>
                    </div>
                    {isAdmin && player.skill && (
                      <span className="text-yellow-400 font-bold text-xs flex-shrink-0">
                        {player.skill}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function EditTeamsModal({
  teamA: initialTeamA,
  teamB: initialTeamB,
  teamC: initialTeamC,
  editingTeamIndex,
  onClose,
  onSave,
  isAdmin,
}: EditTeamsModalProps) {
  const is3Squad = !!initialTeamC;

  const [teamA, setTeamA] = useState<Player[]>(initialTeamA);
  const [teamB, setTeamB] = useState<Player[]>(initialTeamB);
  const [teamC, setTeamC] = useState<Player[]>(initialTeamC || []);
  const [activePair, setActivePair] = useState<Pair>("AB");
  const [selectedPlayer, setSelectedPlayer] = useState<{
    player: Player;
    fromIndex: number;
  } | null>(null);

  const allTeams = [teamA, teamB, teamC];
  const setters = [setTeamA, setTeamB, setTeamC];

  // Resolve which two team indices the current pair refers to
  const pairIndices: Record<Pair, [number, number]> = {
    AB: [0, 1],
    BC: [1, 2],
    AC: [0, 2],
  };
  const [leftIdx, rightIdx] = is3Squad ? pairIndices[activePair] : [0, 1];

  const leftTeam = allTeams[leftIdx];
  const rightTeam = allTeams[rightIdx];

  const skillDiff = Math.abs(totalSkill(leftTeam) - totalSkill(rightTeam));

  const handlePlayerClick = (player: Player, teamIndex: number) => {
    if (!selectedPlayer) {
      setSelectedPlayer({ player, fromIndex: teamIndex });
      return;
    }

    if (selectedPlayer.fromIndex === teamIndex) {
      // Same team — deselect or re-select
      if (selectedPlayer.player.id === player.id) {
        setSelectedPlayer(null);
      } else {
        setSelectedPlayer({ player, fromIndex: teamIndex });
      }
      return;
    }

    // Different team — perform swap
    const sourceTeam = [...allTeams[selectedPlayer.fromIndex]];
    const targetTeam = [...allTeams[teamIndex]];

    const sourceIdx = sourceTeam.findIndex((p) => p.id === selectedPlayer.player.id);
    const targetIdx = targetTeam.findIndex((p) => p.id === player.id);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      [sourceTeam[sourceIdx], targetTeam[targetIdx]] = [targetTeam[targetIdx], sourceTeam[sourceIdx]];
      setters[selectedPlayer.fromIndex](sourceTeam);
      setters[teamIndex](targetTeam);
    }

    setSelectedPlayer(null);
    if ("vibrate" in navigator) navigator.vibrate(30);
  };

  const handleSave = () => {
    setSelectedPlayer(null);
    if (is3Squad) {
      onSave(teamA, teamB, teamC);
    } else {
      onSave(teamA, teamB);
    }
  };

  const teamConfig = [
    { label: "Squad A", icon: "🔵", borderColor: "border-blue-500/30", highlightColor: "border-blue-400 bg-blue-500/10" },
    { label: "Squad B", icon: "🔴", borderColor: "border-red-500/30", highlightColor: "border-red-400 bg-red-500/10" },
    { label: "Squad C", icon: "🟢", borderColor: "border-green-500/30", highlightColor: "border-green-400 bg-green-500/10" },
  ];

  const left = teamConfig[leftIdx];
  const right = teamConfig[rightIdx];

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
        <h2 className="text-xl font-black text-yellow-400">✏️ Edit Teams</h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <FaTimes className="text-gray-400 text-xl" />
        </motion.button>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 3-squad pair picker */}
        {is3Squad && (
          <div className="flex gap-2">
            {(["AB", "BC", "AC"] as Pair[]).map((pair) => (
              <button
                key={pair}
                onClick={() => { setActivePair(pair); setSelectedPlayer(null); }}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  activePair === pair
                    ? "bg-yellow-500 text-slate-900"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                {pair[0]} ↔ {pair[1]}
              </button>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300">
          Tap a player to select, then tap a player from the other squad to swap them.
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-3">
          <TeamColumn
            {...left}
            players={leftTeam}
            teamIndex={leftIdx}
            selectedPlayer={selectedPlayer}
            onPlayerClick={handlePlayerClick}
            isAdmin={isAdmin}
          />
          <TeamColumn
            {...right}
            players={rightTeam}
            teamIndex={rightIdx}
            selectedPlayer={selectedPlayer}
            onPlayerClick={handlePlayerClick}
            isAdmin={isAdmin}
          />
        </div>

        {/* Balance indicator */}
        <div
          className={`p-3 rounded-lg border text-center ${
            skillDiff <= 2
              ? "bg-green-500/10 border-green-500/30"
              : "bg-yellow-500/10 border-yellow-500/30"
          }`}
        >
          <p className="text-xs text-gray-400 mb-1">Skill Balance ({left.label} vs {right.label})</p>
          <div className="text-xl font-black">
            {totalSkill(leftTeam)} vs {totalSkill(rightTeam)}
          </div>
          <div className={`text-xs font-bold mt-1 ${skillDiff <= 2 ? "text-green-400" : "text-yellow-400"}`}>
            Diff: {skillDiff} {skillDiff <= 2 ? "✓ Balanced" : "⚠️ Unbalanced"}
          </div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-slate-900 border-t border-yellow-500/20 px-4 py-4 flex gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
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
