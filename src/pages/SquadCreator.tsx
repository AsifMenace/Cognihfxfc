// src/pages/SquadCreator.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerSelector } from '../components/PlayerSelector';
import { TeamDisplay } from '../components/TeamDisplay';
import { EditTeamsModal } from '../components/EditTeamsModal';
import { MatchLinkingModal } from '../components/MatchLinkingModal';
import { SquadHistory } from '../components/SquadHistory';
import { getAdminHeaders } from '../utils/auth';
import { FaStar, FaFire, FaCheck, FaUsers } from 'react-icons/fa';

interface SquadCreatorProps {
  isAdmin: boolean;
}

interface Player {
  id: number;
  name: string;
  position: string;
  skill?: number;
  photo?: string;
}

interface Team {
  id: number;
  name: string;
  color: string | null;
}

interface Booking {
  booking_date: string;
  start_time: string;
  session?: string;
  field_number?: string;
}

type SquadMode = '2squad' | '3squad';

export function SquadCreator({ isAdmin }: SquadCreatorProps) {
  const [squadMode, setSquadMode] = useState<SquadMode>('2squad');

  // Player state
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);

  // Squad state
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [teamC, setTeamC] = useState<Player[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSquadId, setSavedSquadId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [editingTeamIndex, setEditingTeamIndex] = useState(0);
  const [showSquadHistory, setShowSquadHistory] = useState(false);

  // Team assignment for create-match flow (both modes)
  const [registeredTeams, setRegisteredTeams] = useState<Team[]>([]);
  const [assignedTeamA, setAssignedTeamA] = useState<number | null>(null);
  const [assignedTeamB, setAssignedTeamB] = useState<number | null>(null);
  const [assignedTeamC, setAssignedTeamC] = useState<number | null>(null);
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [matchCreated, setMatchCreated] = useState<{
    pairings: string[];
    matchDate: string;
    matchTime: string;
  } | null>(null);

  const squadsGenerated = teamA.length > 0 && teamB.length > 0;

  // ── Fetch players ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/.netlify/functions/getPlayersForSquadCreator')
      .then((r) => r.json())
      .then((data) => setAllPlayers(data.players))
      .catch(() => setError('Failed to load players'));
  }, []);

  // ── Fetch registered teams + next booking when squads are generated ────────
  useEffect(() => {
    if (!squadsGenerated) return;
    Promise.all([
      fetch('/.netlify/functions/getTeams').then((r) => r.json()),
      fetch('/.netlify/functions/getUpcomingBookings').then((r) => r.json()),
    ]).then(([teams, bookings]) => {
      setRegisteredTeams(Array.isArray(teams) ? teams : []);
      if (Array.isArray(bookings) && bookings.length > 0) {
        setNextBooking(bookings[0]);
      }
    }).catch(() => {});
  }, [squadsGenerated]);

  // ── Player toggle ──────────────────────────────────────────────────────────
  const handlePlayerToggle = (playerId: number) => {
    const max = squadMode === '3squad' ? 24 : 20;
    setSelectedPlayerIds((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId);
      if (prev.length >= max) return prev;
      return [...prev, playerId];
    });
  };

  // ── Reset everything ───────────────────────────────────────────────────────
  const resetSquads = () => {
    setTeamA([]);
    setTeamB([]);
    setTeamC([]);
    setSavedSquadId(null);
    setAssignedTeamA(null);
    setAssignedTeamB(null);
    setAssignedTeamC(null);
    setMatchCreated(null);
    setError(null);
  };

  // ── Switch mode resets everything ─────────────────────────────────────────
  const handleModeSwitch = (mode: SquadMode) => {
    setSquadMode(mode);
    setSelectedPlayerIds([]);
    resetSquads();
    setShowSquadHistory(false);
  };

  // ── Generate squads ────────────────────────────────────────────────────────
  const handleGenerateSquads = async () => {
    const count = selectedPlayerIds.length;

    if (squadMode === '2squad') {
      if (count < 14 || count > 20 || count % 2 !== 0) {
        setError(
          count % 2 !== 0
            ? `Odd number selected (${count}). Select one more or one less.`
            : 'Select an even number of players between 14 and 20.'
        );
        return;
      }
    } else {
      if (count < 21 || count > 24) {
        setError(`Select between 21 and 24 players for 3 squads. You have ${count}.`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/generateBalancedSquads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerIds: selectedPlayerIds,
          squadCount: squadMode === '3squad' ? 3 : 2,
        }),
      });

      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Failed to generate squads');

      setTeamA(data.teamA.players);
      setTeamB(data.teamB.players);
      if (squadMode === '3squad') setTeamC(data.teamC.players);

      setTimeout(() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate squads');
    } finally {
      setLoading(false);
    }
  };

  // ── Save squad ─────────────────────────────────────────────────────────────
  const handleSaveSquad = async (): Promise<number | null> => {
    if (teamA.length === 0 || teamB.length === 0) return null;

    setLoading(true);
    const calcSkill = (t: Player[]) => t.reduce((s, p) => s + (p.skill || 0), 0);
    const calcFW = (t: Player[]) =>
      t.filter((p) => p.position?.toUpperCase() === 'FORWARD').reduce((s, p) => s + (p.skill || 0), 0);

    try {
      const response = await fetch('/.netlify/functions/saveSquadGeneration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationDate: new Date().toISOString().split('T')[0],
          teamA,
          teamB,
          teamC: squadMode === '3squad' ? teamC : null,
          teamATotalSkill: calcSkill(teamA),
          teamBTotalSkill: calcSkill(teamB),
          teamCTotalSkill: squadMode === '3squad' ? calcSkill(teamC) : null,
          teamAFWSkill: calcFW(teamA),
          teamBFWSkill: calcFW(teamB),
          teamCFWSkill: squadMode === '3squad' ? calcFW(teamC) : null,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to save squad');

      setSavedSquadId(data.squad.id);
      return data.squad.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save squad');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ── Create match (both modes) ──────────────────────────────────────────────
  const handleCreateMatch = async () => {
    if (squadMode === '2squad' && (!assignedTeamA || !assignedTeamB)) {
      setError('Assign both squads to a team before creating the match.');
      return;
    }
    if (squadMode === '3squad' && (!assignedTeamA || !assignedTeamB || !assignedTeamC)) {
      setError('Assign all three squads to a team before creating matches.');
      return;
    }
    if (squadMode === '2squad' && assignedTeamA === assignedTeamB) {
      setError('Both squads cannot be assigned to the same team.');
      return;
    }
    if (
      squadMode === '3squad' &&
      (assignedTeamA === assignedTeamB || assignedTeamB === assignedTeamC || assignedTeamA === assignedTeamC)
    ) {
      setError('Each squad must be assigned to a different team.');
      return;
    }

    setCreatingMatch(true);
    setError(null);

    // Save first if not already saved
    let squadId = savedSquadId;
    if (!squadId) {
      squadId = await handleSaveSquad();
      if (!squadId) { setCreatingMatch(false); return; }
    }

    try {
      const response = await fetch('/.netlify/functions/createMatchFromSquad', {
        method: 'POST',
        headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          squadId,
          squadCount: squadMode === '3squad' ? 3 : 2,
          teamAId: assignedTeamA,
          teamBId: assignedTeamB,
          teamCId: squadMode === '3squad' ? assignedTeamC : undefined,
          teamAPlayers: teamA,
          teamBPlayers: teamB,
          teamCPlayers: squadMode === '3squad' ? teamC : undefined,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to create match');

      setMatchCreated({
        pairings: data.pairings,
        matchDate: data.matchDate,
        matchTime: data.matchTime,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create match');
    } finally {
      setCreatingMatch(false);
    }
  };

  // ── Load from history ──────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoadSquad = (loadedSquad: any) => {
    setTeamA(loadedSquad.teamA);
    setTeamB(loadedSquad.teamB);
    if (loadedSquad.teamC) {
      setTeamC(loadedSquad.teamC);
      setSquadMode('3squad');
    } else {
      setTeamC([]);
      setSquadMode('2squad');
    }
    setSavedSquadId(loadedSquad.id);
    setShowSquadHistory(false);
    setError(null);
    setMatchCreated(null);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pb-6 pt-4 px-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-yellow-400 mb-2 flex items-center justify-center gap-2">
          <FaFire className="text-orange-500" />
          SQUAD CREATOR
          <FaStar className="text-yellow-500" />
        </h1>
        <p className="text-sm text-gray-400">Create balanced teams for friendly matches</p>
      </motion.div>

      {/* Mode Toggle */}
      {!squadsGenerated && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mb-6 max-w-sm mx-auto">
          <button
            onClick={() => handleModeSwitch('2squad')}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              squadMode === '2squad'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            <FaUsers /> 2 Squads
          </button>
          <button
            onClick={() => handleModeSwitch('3squad')}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              squadMode === '3squad'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            <FaUsers /> 3 Squads
          </button>
        </motion.div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-red-500/20 border border-red-500 rounded-xl p-4 max-w-2xl mx-auto"
          >
            <p className="text-red-300 text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Squad saved banner */}
      <AnimatePresence>
        {savedSquadId && squadsGenerated && !matchCreated && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 bg-green-500/20 border border-green-500 rounded-xl p-4 max-w-2xl mx-auto flex items-center gap-2"
          >
            <FaCheck className="text-green-400" />
            <p className="text-green-300 text-sm font-medium">Squad saved!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match created success */}
      <AnimatePresence>
        {matchCreated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 bg-green-500/20 border border-green-500 rounded-xl p-4 max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✅</span>
              <p className="text-green-300 font-bold">
                {squadMode === '3squad' ? '3 Matches created!' : 'Match created!'}
              </p>
            </div>
            <div className="space-y-1 text-sm text-green-200">
              {matchCreated.pairings.map((p, i) => (
                <p key={i}>⚽ {p}</p>
              ))}
              <p className="text-gray-400 mt-2">
                📅 {formatDate(matchCreated.matchDate)} · ⏰ {formatTime(matchCreated.matchTime)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto">
        {/* Pre-generation: history + player selector */}
        {!squadsGenerated && (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSquadHistory(!showSquadHistory)}
              className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 text-gray-300 font-bold rounded-xl transition-colors mb-4"
            >
              📋 View Squad History
            </motion.button>

            <AnimatePresence>
              {showSquadHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <SquadHistory isAdmin={isAdmin} onLoadSquad={handleLoadSquad} squadMode={squadMode} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <PlayerSelector
                allPlayers={allPlayers}
                selectedPlayerIds={selectedPlayerIds}
                onPlayerToggle={handlePlayerToggle}
                isLoading={loading}
                onGenerate={handleGenerateSquads}
                isAdmin={isAdmin}
                squadMode={squadMode}
              />
            </motion.div>
          </>
        )}

        {/* Post-generation: squad cards */}
        {squadsGenerated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* ── 2-SQUAD layout ─────────────────────────────────────────── */}
            {squadMode === '2squad' && (
              <>
                <TeamDisplay
                  team={teamA}
                  teamName="TEAM A"
                  teamColor="bg-blue-600"
                  teamIcon="🔵"
                  onEdit={() => { setEditingTeamIndex(0); setShowEditModal(true); }}
                  onSave={handleSaveSquad}
                  onLink={() => setShowMatchModal(true)}
                  isSaving={loading}
                  isSaved={!!savedSquadId}
                  isAdmin={isAdmin}
                />
                <TeamDisplay
                  team={teamB}
                  teamName="TEAM B"
                  teamColor="bg-red-600"
                  teamIcon="🔴"
                  onEdit={() => { setEditingTeamIndex(1); setShowEditModal(true); }}
                  onSave={handleSaveSquad}
                  onLink={() => setShowMatchModal(true)}
                  isSaving={loading}
                  isSaved={!!savedSquadId}
                  hideAction
                  isAdmin={isAdmin}
                />

                {/* Create Match section for 2-squad */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-800/50 border border-yellow-500/20 rounded-2xl p-5 space-y-4"
                >
                  <h3 className="font-black text-yellow-400 text-lg">Create Match</h3>

                  {nextBooking ? (
                    <div className="text-sm text-gray-400 bg-slate-700/50 rounded-lg p-3">
                      📅 Next session: <span className="text-white font-semibold">
                        {formatDate(nextBooking.booking_date)} · {formatTime(nextBooking.start_time)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-orange-300">
                      ⚠️ No upcoming booking found. Add a field booking before creating a match.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Squad A plays as</label>
                      <select
                        value={assignedTeamA ?? ''}
                        onChange={(e) => setAssignedTeamA(Number(e.target.value) || null)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                      >
                        <option value="">— pick team —</option>
                        {registeredTeams
                          .filter((t) => t.id !== assignedTeamB)
                          .map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Squad B plays as</label>
                      <select
                        value={assignedTeamB ?? ''}
                        onChange={(e) => setAssignedTeamB(Number(e.target.value) || null)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                      >
                        <option value="">— pick team —</option>
                        {registeredTeams
                          .filter((t) => t.id !== assignedTeamA)
                          .map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: nextBooking && assignedTeamA && assignedTeamB ? 1.02 : 1 }}
                    whileTap={{ scale: nextBooking && assignedTeamA && assignedTeamB ? 0.98 : 1 }}
                    onClick={handleCreateMatch}
                    disabled={creatingMatch || !assignedTeamA || !assignedTeamB || !nextBooking}
                    className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      nextBooking && assignedTeamA && assignedTeamB && !creatingMatch
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                        : 'bg-slate-700 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {creatingMatch ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        Creating...
                      </>
                    ) : (
                      '⚡ Create Match'
                    )}
                  </motion.button>

                </motion.div>
              </>
            )}

            {/* ── 3-SQUAD layout ─────────────────────────────────────────── */}
            {squadMode === '3squad' && (
              <>
                <TeamDisplay
                  team={teamA}
                  teamName="SQUAD A"
                  teamColor="bg-blue-600"
                  teamIcon="🔵"
                  onEdit={() => { setEditingTeamIndex(0); setShowEditModal(true); }}
                  onSave={handleSaveSquad}
                  onLink={() => {}}
                  isSaving={loading}
                  isSaved={!!savedSquadId}
                  editOnly
                  isAdmin={isAdmin}
                />
                <TeamDisplay
                  team={teamB}
                  teamName="SQUAD B"
                  teamColor="bg-red-600"
                  teamIcon="🔴"
                  onEdit={() => { setEditingTeamIndex(1); setShowEditModal(true); }}
                  onSave={handleSaveSquad}
                  onLink={() => {}}
                  isSaving={loading}
                  isSaved={!!savedSquadId}
                  editOnly
                  isAdmin={isAdmin}
                />
                <TeamDisplay
                  team={teamC}
                  teamName="SQUAD C"
                  teamColor="bg-green-600"
                  teamIcon="🟢"
                  onEdit={() => { setEditingTeamIndex(2); setShowEditModal(true); }}
                  onSave={handleSaveSquad}
                  onLink={() => {}}
                  isSaving={loading}
                  isSaved={!!savedSquadId}
                  editOnly
                  isAdmin={isAdmin}
                />

                {/* Assign Teams + Create Matches section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-800/50 border border-yellow-500/20 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-yellow-400 text-lg">Assign Squads & Create Matches</h3>
                    {/* Standalone save for 3-squad */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveSquad}
                      disabled={loading}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                        savedSquadId
                          ? 'bg-green-600/40 text-green-300'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {loading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : savedSquadId ? (
                        '✓ Saved'
                      ) : (
                        '💾 Save'
                      )}
                    </motion.button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Round-robin: A vs B · B vs C · C vs A
                  </p>

                  {nextBooking ? (
                    <div className="text-sm text-gray-400 bg-slate-700/50 rounded-lg p-3">
                      📅 Next session: <span className="text-white font-semibold">
                        {formatDate(nextBooking.booking_date)} · {formatTime(nextBooking.start_time)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-orange-300">
                      ⚠️ No upcoming booking found. Add a field booking before creating matches.
                    </div>
                  )}

                  <div className="space-y-3">
                    {[
                      { label: 'Squad A 🔵', value: assignedTeamA, setter: setAssignedTeamA, others: [assignedTeamB, assignedTeamC] },
                      { label: 'Squad B 🔴', value: assignedTeamB, setter: setAssignedTeamB, others: [assignedTeamA, assignedTeamC] },
                      { label: 'Squad C 🟢', value: assignedTeamC, setter: setAssignedTeamC, others: [assignedTeamA, assignedTeamB] },
                    ].map(({ label, value, setter, others }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-white w-24 flex-shrink-0">{label}</span>
                        <select
                          value={value ?? ''}
                          onChange={(e) => setter(Number(e.target.value) || null)}
                          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                        >
                          <option value="">— pick team —</option>
                          {registeredTeams
                            .filter((t) => !others.includes(t.id))
                            .map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: nextBooking && assignedTeamA && assignedTeamB && assignedTeamC ? 1.02 : 1 }}
                    whileTap={{ scale: nextBooking && assignedTeamA && assignedTeamB && assignedTeamC ? 0.98 : 1 }}
                    onClick={handleCreateMatch}
                    disabled={creatingMatch || !assignedTeamA || !assignedTeamB || !assignedTeamC || !nextBooking}
                    className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      nextBooking && assignedTeamA && assignedTeamB && assignedTeamC && !creatingMatch
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                        : 'bg-slate-700 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {creatingMatch ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        Creating matches...
                      </>
                    ) : (
                      '⚡ Save & Create Matches'
                    )}
                  </motion.button>
                </motion.div>
              </>
            )}

            {/* Back button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetSquads}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-xl transition-colors"
            >
              ← Generate New Squads
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <EditTeamsModal
            teamA={teamA}
            teamB={teamB}
            teamC={squadMode === '3squad' ? teamC : undefined}
            editingTeamIndex={editingTeamIndex}
            onClose={() => setShowEditModal(false)}
            onSave={(newA, newB, newC) => {
              setTeamA(newA);
              setTeamB(newB);
              if (newC) setTeamC(newC);
              setShowEditModal(false);
              setSavedSquadId(null); // mark as unsaved after edit
            }}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>

      {/* Link to match modal (2-squad only) */}
      <AnimatePresence>
        {showMatchModal && (
          <MatchLinkingModal
            squadId={savedSquadId || 0}
            teamA={teamA}
            teamB={teamB}
            onClose={() => setShowMatchModal(false)}
            onSuccess={() => setShowMatchModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
