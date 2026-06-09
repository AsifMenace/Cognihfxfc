// src/components/squad-creator/PlayerSelector.tsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFire, FaCheck, FaClipboardList } from 'react-icons/fa';

interface Player {
  id: number;
  name: string;
  position: string;
  skill?: number;
  runner?: boolean;
}

interface PlayerSelectorProps {
  allPlayers: Player[];
  selectedPlayerIds: number[];
  onPlayerToggle: (playerId: number) => void;
  isLoading: boolean;
  onGenerate: () => void;
  isAdmin: boolean;
  squadMode: '2squad' | '3squad';
}

// Normalise a name for matching: lowercase, strip extra spaces
const normaliseName = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

// Simple match: paste token must be contained in player name or vice-versa (handles
// short pastes like "Sur" → "Surya" only when exactly one candidate exists)
function matchToken(token: string, players: Player[]): Player | null {
  const t = normaliseName(token);
  if (!t) return null;

  // 1. Exact match first
  const exact = players.find((p) => normaliseName(p.name) === t);
  if (exact) return exact;

  // 2. Player name starts with token (e.g. "Sur" → "Surya")
  const startsWith = players.filter((p) => normaliseName(p.name).startsWith(t));
  if (startsWith.length === 1) return startsWith[0];

  // 3. Token contains the full player name (e.g. "Akhil K" contains "Akhil")
  const contained = players.filter((p) => t.includes(normaliseName(p.name)));
  if (contained.length === 1) return contained[0];

  return null;
}

export function PlayerSelector({
  allPlayers,
  selectedPlayerIds,
  onPlayerToggle,
  isLoading,
  onGenerate,
  isAdmin,
  squadMode,
}: PlayerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteResult, setPasteResult] = useState<{
    matched: string[];
    notFound: string[];
    skipped: string[]; // already selected
    capped: string[]; // over the limit
  } | null>(null);

  const selectedCount = selectedPlayerIds.length;
  const is2Squad = squadMode === '2squad';
  const isComplete = is2Squad
    ? selectedCount >= 14 && selectedCount <= 20 && selectedCount % 2 === 0
    : selectedCount >= 21 && selectedCount <= 24;
  const maxPlayers = is2Squad ? 20 : 24;

  const selectedRunnerCount = allPlayers.filter(
    (p) => p.runner && selectedPlayerIds.includes(p.id)
  ).length;

  // ── Paste-select handler ───────────────────────────────────────────────────
  const handlePasteSelect = () => {
    const tokens = pasteText
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const matched: string[] = [];
    const notFound: string[] = [];
    const skipped: string[] = [];
    const capped: string[] = [];

    let runningCount = selectedCount;

    for (const token of tokens) {
      const player = matchToken(token, allPlayers);

      if (!player) {
        notFound.push(token);
        continue;
      }

      if (selectedPlayerIds.includes(player.id)) {
        skipped.push(player.name);
        continue;
      }

      if (runningCount >= maxPlayers) {
        capped.push(player.name);
        continue;
      }

      onPlayerToggle(player.id);
      matched.push(player.name);
      runningCount++;
    }

    setPasteResult({ matched, notFound, skipped, capped });
    if (matched.length > 0) setPasteText('');
  };

  const clearPaste = () => {
    setPasteText('');
    setPasteResult(null);
  };

  // ── Filter players based on search ────────────────────────────────────────
  const filteredPlayers = useMemo(() => {
    return allPlayers.filter(
      (player) =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.position.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allPlayers, searchQuery]);

  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase();
    if (pos === 'GOALKEEPER' || pos === 'GK') return 'text-yellow-400';
    if (pos === 'DEFENDER' || pos === 'DEF') return 'text-blue-400';
    if (pos === 'MIDFIELDER' || pos === 'MID') return 'text-green-400';
    if (pos === 'FORWARD' || pos === 'FW') return 'text-red-400';
    return 'text-gray-400';
  };

  const getPositionEmoji = (position: string) => {
    const pos = position.toUpperCase();
    if (pos === 'GOALKEEPER' || pos === 'GK') return '🧤';
    if (pos === 'DEFENDER' || pos === 'DEF') return '💪';
    if (pos === 'MIDFIELDER' || pos === 'MID') return '⚙️';
    if (pos === 'FORWARD' || pos === 'FW') return '🚀';
    return '👤';
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
              isComplete ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
            }`}
          >
            {selectedCount}/{is2Squad ? '14-20' : '21-24'}
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((selectedCount / maxPlayers) * 100, 100)}%` }}
            className={`h-full ${isComplete ? 'bg-green-500' : 'bg-yellow-500'}`}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {is2Squad
            ? selectedCount < 14
              ? `Select ${14 - selectedCount} more for 7v7`
              : selectedCount % 2 !== 0
                ? 'Select 1 more player to balance the teams'
                : isComplete
                  ? `Ready for ${selectedCount / 2}v${selectedCount / 2}!`
                  : `${selectedCount} selected — max 20`
            : selectedCount < 21
              ? `Select ${21 - selectedCount} more (min 21 for 3 squads)`
              : isComplete
                ? `Ready — ${selectedCount} players across 3 squads`
                : `${selectedCount} selected — max 24`}
        </p>
        {selectedRunnerCount > 0 && (
          <p className="text-xs text-orange-400 mt-1">
            🏃 {selectedRunnerCount} runner{selectedRunnerCount !== 1 ? 's' : ''} selected — will be
            balanced across teams
          </p>
        )}
      </div>

      {/* ── Paste Names toggle ──────────────────────────────────────────────── */}
      <div className="mb-4">
        <button
          onClick={() => {
            setShowPaste((v) => !v);
            clearPaste();
          }}
          className="flex items-center gap-2 text-sm font-semibold text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          <FaClipboardList className="text-base" />
          {showPaste ? 'Hide paste names' : 'Paste names'}
          <span className="text-gray-500 font-normal">(comma-separated)</span>
        </button>

        <AnimatePresence>
          {showPaste && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2 overflow-hidden"
            >
              <textarea
                rows={3}
                placeholder="Surya, Akhil, Sayan, Biswa, Karthik..."
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  setPasteResult(null);
                }}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 resize-none"
              />

              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePasteSelect}
                  disabled={!pasteText.trim()}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                    pasteText.trim()
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900'
                      : 'bg-slate-700 text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  Select All Matched
                </motion.button>
                {(pasteText || pasteResult) && (
                  <button
                    onClick={clearPaste}
                    className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white bg-slate-700 hover:bg-slate-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Result feedback */}
              <AnimatePresence>
                {pasteResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg bg-slate-700/60 border border-slate-600 px-3 py-2 space-y-1 text-xs"
                  >
                    {pasteResult.matched.length > 0 && (
                      <p className="text-green-400">
                        ✅ {pasteResult.matched.length} selected: {pasteResult.matched.join(', ')}
                      </p>
                    )}
                    {pasteResult.skipped.length > 0 && (
                      <p className="text-gray-400">
                        ↩ Already selected: {pasteResult.skipped.join(', ')}
                      </p>
                    )}
                    {pasteResult.notFound.length > 0 && (
                      <p className="text-red-400">
                        ⚠️ Not found: {pasteResult.notFound.join(', ')}
                      </p>
                    )}
                    {pasteResult.capped.length > 0 && (
                      <p className="text-orange-400">
                        🚫 Max reached, skipped: {pasteResult.capped.join(', ')}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
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
            const isDisabled = !isSelected && selectedPlayerIds.length >= maxPlayers;

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
                    ? 'bg-yellow-500/10 border-yellow-500/50 hover:border-yellow-500'
                    : isDisabled
                      ? 'bg-slate-700/30 border-slate-600/30 cursor-not-allowed opacity-50'
                      : 'bg-slate-700/30 border-slate-600/30 hover:border-yellow-500/50 hover:bg-slate-700/50'
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-yellow-500 border-yellow-500'
                      : 'border-gray-500 group-hover:border-yellow-500'
                  }`}
                >
                  {isSelected && <FaCheck className="text-slate-900 text-xs" />}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-white truncate">{player.name}</p>
                    {player.runner && <span className="text-sm flex-shrink-0">🏃</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">{getPositionEmoji(player.position)}</span>
                    <span className={getPositionColor(player.position)}>{player.position}</span>
                  </div>
                </div>

                {/* Skill (Admin only) */}
                {isAdmin && player.skill && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <FaFire className="text-orange-500 text-xs" />
                    <span className="text-yellow-400 font-bold text-sm">{player.skill}</span>
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
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-slate-900'
            : 'bg-slate-700 text-gray-400 cursor-not-allowed opacity-50'
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
        {is2Squad
          ? 'Algorithm generates balanced teams based on skills and positions'
          : 'Algorithm generates 3 balanced squads — round-robin matches auto-created'}
      </p>
    </motion.div>
  );
}
