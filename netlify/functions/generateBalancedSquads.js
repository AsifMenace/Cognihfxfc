// functions/generateBalancedSquads.js
import { neon } from '@netlify/neon';

const sql = neon(process.env.DATABASE_URL);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateTotalSkill(players) {
  return players.reduce((sum, p) => sum + (p.skill || 0), 0);
}

function calculateFWSkill(players) {
  return players
    .filter((p) => p.position?.toUpperCase() === 'FORWARD')
    .reduce((sum, p) => sum + (p.skill || 0), 0);
}

function getGKCount(players) {
  return players.filter((p) => p.position?.toUpperCase() === 'GOALKEEPER').length;
}

function getPositionBreakdown(players) {
  const breakdown = {
    GK: 0,
    DEF: 0,
    MID: 0,
    FW: 0,
  };

  players.forEach((p) => {
    const pos = p.position?.toUpperCase();

    // Match full position names
    if (pos === 'GOALKEEPER') breakdown.GK++;
    else if (pos === 'DEFENDER') breakdown.DEF++;
    else if (pos === 'MIDFIELDER') breakdown.MID++;
    else if (pos === 'FORWARD') breakdown.FW++;
  });

  return breakdown;
}

function countRunners(players) {
  return players.filter((p) => p.runner).length;
}

function calculateScore(teamA, teamB) {
  const skillDiff = Math.abs(calculateTotalSkill(teamA) - calculateTotalSkill(teamB));
  const fwSkillDiff = Math.abs(calculateFWSkill(teamA) - calculateFWSkill(teamB));

  let positionBalance = 0;
  const breakdownA = getPositionBreakdown(teamA);
  const breakdownB = getPositionBreakdown(teamB);

  Object.keys(breakdownA).forEach((pos) => {
    const diff = Math.abs(breakdownA[pos] - breakdownB[pos]);
    positionBalance += diff;
  });

  const runnerImbalance = Math.abs(countRunners(teamA) - countRunners(teamB));

  const score = skillDiff * 5 + fwSkillDiff * 3 + positionBalance * 2 + runnerImbalance * 4;
  return score;
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function groupByPosition(players) {
  const groups = {
    GK: [],
    DEF: [],
    MID: [],
    FW: [],
  };

  players.forEach((p) => {
    const pos = p.position?.toUpperCase();

    // Match full position names
    if (pos === 'GOALKEEPER') groups.GK.push(p);
    else if (pos === 'DEFENDER') groups.DEF.push(p);
    else if (pos === 'MIDFIELDER') groups.MID.push(p);
    else if (pos === 'FORWARD') groups.FW.push(p);
  });

  return groups;
}

function generateRandomCombination(players, teamSize) {
  const positions = groupByPosition(players);

  let teamA = [];
  let teamB = [];

  // Distribute GKs
  let gkCount = positions.GK.length;
  if (gkCount >= 2) {
    teamA.push(positions.GK[0]);
    teamB.push(positions.GK[1]);
    positions.GK = positions.GK.slice(2);
  } else if (gkCount === 1) {
    teamA.push(positions.GK[0]);
    if (positions.DEF.length > 0) {
      const defExtra = positions.DEF.pop();
      teamB.push(defExtra);
    }
  }

  // Combine all remaining players (DEF, MID, FW)
  const remaining = [...positions.DEF, ...positions.MID, ...positions.FW];

  // Shuffle them
  const shuffled = shuffleArray(remaining);

  // Distribute evenly to reach teamSize
  for (let i = 0; i < shuffled.length; i++) {
    if (teamA.length < teamSize) {
      teamA.push(shuffled[i]);
    } else if (teamB.length < teamSize) {
      teamB.push(shuffled[i]);
    }
  }

  return {
    teamA: teamA.slice(0, teamSize),
    teamB: teamB.slice(0, teamSize),
  };
}

function generateOptimalSquads(players, teamSize, iterations = 1000) {
  let bestScore = Infinity;
  let bestCombination = null;

  for (let i = 0; i < iterations; i++) {
    const { teamA, teamB } = generateRandomCombination(players, teamSize);

    if (teamA.length !== teamSize || teamB.length !== teamSize) continue;

    const score = calculateScore(teamA, teamB);

    if (score < bestScore) {
      bestScore = score;
      bestCombination = { teamA, teamB, score };
      if (bestScore === 0) break;
    }
  }

  return bestCombination;
}

// ============================================================================
// 3-SQUAD FUNCTIONS
// ============================================================================

function calculateScore3(teamA, teamB, teamC) {
  const pairScore = calculateScore(teamA, teamB) + calculateScore(teamB, teamC) + calculateScore(teamA, teamC);
  const rc = [countRunners(teamA), countRunners(teamB), countRunners(teamC)];
  const runnerImbalance = Math.max(...rc) - Math.min(...rc);
  return pairScore + runnerImbalance * 4;
}

function generateRandomCombination3(players, teamSizes) {
  const [sizeA, sizeB, sizeC] = teamSizes;
  const positions = groupByPosition(players);

  const teamA = [];
  const teamB = [];
  const teamC = [];

  // Distribute GKs — one per team where possible
  const gkCount = positions.GK.length;
  if (gkCount >= 3) {
    teamA.push(positions.GK[0]);
    teamB.push(positions.GK[1]);
    teamC.push(positions.GK[2]);
    positions.GK = positions.GK.slice(3);
  } else if (gkCount === 2) {
    teamA.push(positions.GK[0]);
    teamB.push(positions.GK[1]);
    if (positions.DEF.length > 0) teamC.push(positions.DEF.pop());
    positions.GK = [];
  } else if (gkCount === 1) {
    teamA.push(positions.GK[0]);
    if (positions.DEF.length > 0) teamB.push(positions.DEF.pop());
    if (positions.DEF.length > 0) teamC.push(positions.DEF.pop());
    positions.GK = [];
  }

  const remaining = [...positions.GK, ...positions.DEF, ...positions.MID, ...positions.FW];
  const shuffled = shuffleArray(remaining);

  for (const player of shuffled) {
    if (teamA.length < sizeA) teamA.push(player);
    else if (teamB.length < sizeB) teamB.push(player);
    else if (teamC.length < sizeC) teamC.push(player);
  }

  return { teamA, teamB, teamC };
}

function generateOptimalSquads3(players, teamSizes, iterations = 1000) {
  let bestScore = Infinity;
  let bestCombination = null;

  for (let i = 0; i < iterations; i++) {
    const { teamA, teamB, teamC } = generateRandomCombination3(players, teamSizes);

    if (
      teamA.length !== teamSizes[0] ||
      teamB.length !== teamSizes[1] ||
      teamC.length !== teamSizes[2]
    ) continue;

    const score = calculateScore3(teamA, teamB, teamC);

    if (score < bestScore) {
      bestScore = score;
      bestCombination = { teamA, teamB, teamC, score };
      if (bestScore === 0) break;
    }
  }

  return bestCombination;
}

// ============================================================================
// MAIN ENDPOINT
// ============================================================================

export default async (req, context) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { playerIds, squadCount = 2 } = body;

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return new Response(JSON.stringify({ error: 'playerIds array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const totalPlayers = playerIds.length;

    if (squadCount === 3) {
      if (totalPlayers < 21 || totalPlayers > 24) {
        return new Response(
          JSON.stringify({
            error: `For 3 squads, select between 21 and 24 players. You selected ${totalPlayers}.`,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      if (totalPlayers % 2 !== 0) {
        return new Response(
          JSON.stringify({
            error: `You selected ${totalPlayers} players. Please select an even number for balanced teams.`,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (totalPlayers < 14 || totalPlayers > 20) {
        return new Response(
          JSON.stringify({
            error: `Invalid number of players. Support is for 14 to 20 players, you provided ${totalPlayers}.`,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch player details
    const players = await sql`
      SELECT id, name, position, skill, runner
      FROM players
      WHERE id = ANY(${playerIds})
    `;

    if (players.length !== playerIds.length) {
      return new Response(JSON.stringify({ error: 'One or more players not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const startTime = Date.now();

    // ── 3-SQUAD PATH ──────────────────────────────────────────────────────────
    if (squadCount === 3) {
      const base = Math.floor(totalPlayers / 3);
      const extra = totalPlayers % 3;
      const teamSizes = [
        base + (extra > 0 ? 1 : 0),
        base + (extra > 1 ? 1 : 0),
        base,
      ];

      const result = generateOptimalSquads3(players, teamSizes, 1000);
      const generationTime = Date.now() - startTime;

      if (!result) {
        return new Response(
          JSON.stringify({ error: 'Could not generate balanced squads. Try different players.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { teamA, teamB, teamC } = result;
      const teamASkill = calculateTotalSkill(teamA);
      const teamBSkill = calculateTotalSkill(teamB);
      const teamCSkill = calculateTotalSkill(teamC);
      const maxDiff = Math.max(
        Math.abs(teamASkill - teamBSkill),
        Math.abs(teamBSkill - teamCSkill),
        Math.abs(teamASkill - teamCSkill)
      );

      return new Response(
        JSON.stringify({
          success: true,
          squadCount: 3,
          teamA: {
            players: teamA,
            totalSkill: teamASkill,
            fwSkill: calculateFWSkill(teamA),
            positions: getPositionBreakdown(teamA),
            gkCount: getGKCount(teamA),
            runnerCount: countRunners(teamA),
          },
          teamB: {
            players: teamB,
            totalSkill: teamBSkill,
            fwSkill: calculateFWSkill(teamB),
            positions: getPositionBreakdown(teamB),
            gkCount: getGKCount(teamB),
            runnerCount: countRunners(teamB),
          },
          teamC: {
            players: teamC,
            totalSkill: teamCSkill,
            fwSkill: calculateFWSkill(teamC),
            positions: getPositionBreakdown(teamC),
            gkCount: getGKCount(teamC),
            runnerCount: countRunners(teamC),
          },
          metadata: {
            totalPlayers,
            teamSizes,
            maxSkillDifference: maxDiff,
            generationTime,
            algorithm: 'iterative-optimized-3squad',
            iterations: 1000,
            balanced: maxDiff <= 3,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // ── 2-SQUAD PATH ──────────────────────────────────────────────────────────
    const teamSize = totalPlayers / 2;
    const result = generateOptimalSquads(players, teamSize, 1000);
    const generationTime = Date.now() - startTime;

    if (!result) {
      return new Response(
        JSON.stringify({
          error: 'Could not generate balanced squads. Try different players.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { teamA, teamB, score } = result;

    const teamASkill = calculateTotalSkill(teamA);
    const teamBSkill = calculateTotalSkill(teamB);
    const skillDifference = Math.abs(teamASkill - teamBSkill);

    const teamAFWSkill = calculateFWSkill(teamA);
    const teamBFWSkill = calculateFWSkill(teamB);
    const fwSkillDifference = Math.abs(teamAFWSkill - teamBFWSkill);

    return new Response(
      JSON.stringify({
        success: true,
        squadCount: 2,
        teamA: {
          players: teamA,
          totalSkill: teamASkill,
          fwSkill: teamAFWSkill,
          positions: getPositionBreakdown(teamA),
          gkCount: getGKCount(teamA),
          runnerCount: countRunners(teamA),
        },
        teamB: {
          players: teamB,
          totalSkill: teamBSkill,
          fwSkill: teamBFWSkill,
          positions: getPositionBreakdown(teamB),
          gkCount: getGKCount(teamB),
          runnerCount: countRunners(teamB),
        },
        metadata: {
          totalPlayers,
          teamSize,
          skillDifference,
          fwSkillDifference,
          generationTime,
          algorithm: 'iterative-optimized-c',
          iterations: 1000,
          balanced: skillDifference <= 2,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error generating squads:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
