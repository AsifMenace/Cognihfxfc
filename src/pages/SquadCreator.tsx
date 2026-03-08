// src/pages/SquadCreator.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayerSelector } from "../components/PlayerSelector";
import { TeamDisplay } from "../components/TeamDisplay";
import { EditTeamsModal } from "../components/EditTeamsModal";
import { MatchLinkingModal } from "../components/MatchLinkingModal";
import { FaStar, FaFire, FaCheck } from "react-icons/fa";

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

interface Squad {
  players: Player[];
  totalSkill: number;
  fwSkill: number;
  positions: {
    GK: number;
    DEF: number;
    MID: number;
    FW: number;
  };
  gkCount: number;
}

interface GenerationState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function SquadCreator({ isAdmin }: SquadCreatorProps) {
  // State Management
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [generation, setGeneration] = useState<GenerationState>({
    loading: false,
    error: null,
    success: false,
  });
  const [savedSquadId, setSavedSquadId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [editingTeamIndex, setEditingTeamIndex] = useState(0);

  // Fetch all players on mount
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        console.log(
          "Fetching from: /.netlify/functions/getPlayersForSquadCreator",
        );
        const response = await fetch(
          "/.netlify/functions/getPlayersForSquadCreator",
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Response status:", response.status);
          console.error("Response text:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("Players loaded:", data);
        setAllPlayers(data.players);
      } catch (error) {
        console.error("Error fetching players:", error);
        setGeneration({
          loading: false,
          error: `Failed to load players: ${error instanceof Error ? error.message : "Unknown error"}`,
          success: false,
        });
      }
    };

    fetchPlayers();
  }, []);

  // Handle player selection
  const handlePlayerToggle = (playerId: number) => {
    setSelectedPlayerIds((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      } else {
        // Limit selection to 14 or 16
        if (prev.length >= 16) {
          return prev;
        }
        return [...prev, playerId];
      }
    });
  };

  // Generate balanced squads
  const handleGenerateSquads = async () => {
    if (selectedPlayerIds.length !== 14 && selectedPlayerIds.length !== 16) {
      setGeneration({
        loading: false,
        error: `Select exactly 14 or 16 players (${selectedPlayerIds.length} selected)`,
        success: false,
      });
      return;
    }

    setGeneration({ loading: true, error: null, success: false });

    try {
      const response = await fetch(
        "/.netlify/functions/generateBalancedSquads",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerIds: selectedPlayerIds }),
        },
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate squads");
      }

      setTeamA(data.teamA.players);
      setTeamB(data.teamB.players);
      setGeneration({ loading: false, error: null, success: true });

      // Scroll to teams on mobile
      setTimeout(() => {
        window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
      }, 100);
    } catch (error) {
      setGeneration({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to generate squads",
        success: false,
      });
    }
  };

  // Save squad to database
  const handleSaveSquad = async () => {
    if (teamA.length === 0 || teamB.length === 0) return;

    setGeneration({ loading: true, error: null, success: false });

    try {
      const teamASkill = teamA.reduce((sum, p) => sum + (p.skill || 0), 0);
      const teamBSkill = teamB.reduce((sum, p) => sum + (p.skill || 0), 0);
      const teamAFW = teamA
        .filter((p) => p.position?.toUpperCase() === "FORWARD")
        .reduce((sum, p) => sum + (p.skill || 0), 0);
      const teamBFW = teamB
        .filter((p) => p.position?.toUpperCase() === "FORWARD")
        .reduce((sum, p) => sum + (p.skill || 0), 0);

      const response = await fetch("/.netlify/functions/saveSquadGeneration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationDate: new Date().toISOString().split("T")[0],
          teamA,
          teamB,
          teamATotalSkill: teamASkill,
          teamBTotalSkill: teamBSkill,
          teamAFWSkill: teamAFW,
          teamBFWSkill: teamBFW,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save squad");
      }

      setSavedSquadId(data.squad.id);
      setGeneration({ loading: false, error: null, success: true });
    } catch (error) {
      setGeneration({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to save squad",
        success: false,
      });
    }
  };

  // Check if squads are generated
  const squadsGenerated = teamA.length > 0 && teamB.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pb-6 pt-4 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <h1 className="text-2xl sm:text-3xl font-black text-yellow-400 mb-2 flex items-center justify-center gap-2">
          <FaFire className="text-orange-500" />
          SQUAD CREATOR
          <FaStar className="text-yellow-500" />
        </h1>
        <p className="text-sm text-gray-400">
          Create balanced teams for friendly matches
        </p>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {generation.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-red-500/20 border border-red-500 rounded-xl p-4"
          >
            <p className="text-red-300 text-sm font-medium">
              {generation.error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {generation.success && !squadsGenerated && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-2"
          >
            <FaCheck className="text-green-400" />
            <p className="text-green-300 text-sm font-medium">
              Squad saved successfully!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        {/* Player Selector Section */}
        {!squadsGenerated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <PlayerSelector
              allPlayers={allPlayers}
              selectedPlayerIds={selectedPlayerIds}
              onPlayerToggle={handlePlayerToggle}
              isLoading={generation.loading}
              onGenerate={handleGenerateSquads}
              isAdmin={isAdmin}
            />
          </motion.div>
        )}

        {/* Teams Display Section */}
        {squadsGenerated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Team A */}
            <TeamDisplay
              team={teamA}
              teamName="TEAM A"
              teamColor="bg-blue-600"
              teamIcon="🔵"
              onEdit={() => {
                setEditingTeamIndex(0);
                setShowEditModal(true);
              }}
              onSave={handleSaveSquad}
              onLink={() => setShowMatchModal(true)}
              isSaving={generation.loading}
              isSaved={!!savedSquadId}
              isAdmin={isAdmin}
            />

            {/* Team B */}
            <TeamDisplay
              team={teamB}
              teamName="TEAM B"
              teamColor="bg-red-600"
              teamIcon="🔴"
              onEdit={() => {
                setEditingTeamIndex(1);
                setShowEditModal(true);
              }}
              onSave={handleSaveSquad}
              onLink={() => setShowMatchModal(true)}
              isSaving={generation.loading}
              isSaved={!!savedSquadId}
              hideAction
              isAdmin={isAdmin}
            />

            {/* Back to selector button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setTeamA([]);
                setTeamB([]);
                setSavedSquadId(null);
              }}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-xl transition-colors"
            >
              ← Generate New Squads
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Edit Teams Modal */}
      <AnimatePresence>
        {showEditModal && (
          <EditTeamsModal
            teamA={teamA}
            teamB={teamB}
            editingTeamIndex={editingTeamIndex}
            onClose={() => setShowEditModal(false)}
            onSave={(newTeamA, newTeamB) => {
              setTeamA(newTeamA);
              setTeamB(newTeamB);
              setShowEditModal(false);
            }}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>

      {/* Match Linking Modal */}
      <AnimatePresence>
        {showMatchModal && (
          <MatchLinkingModal
            squadId={savedSquadId || 0}
            teamA={teamA}
            teamB={teamB}
            onClose={() => setShowMatchModal(false)}
            onSuccess={() => {
              setShowMatchModal(false);
              // Show success message
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
