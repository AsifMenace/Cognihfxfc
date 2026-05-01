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

  const score = skillDiff * 5 + fwSkillDiff * 3 + positionBalance * 2;
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
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < iterations; i++) {
    const { teamA, teamB } = generateRandomCombination(players, teamSize);

    if (teamA.length !== teamSize || teamB.length !== teamSize) {
      failCount++;
      continue;
    }

    successCount++;
    const score = calculateScore(teamA, teamB);

    if (score < bestScore) {
      bestScore = score;
      bestCombination = { teamA, teamB, score };

      if (bestScore === 0) {
        break;
      }
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
    const { playerIds } = body;

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return new Response(JSON.stringify({ error: 'playerIds array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const totalPlayers = playerIds.length;

    // NEW DYNAMIC VALIDATION
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

    // Dynamic team size calculation
    const teamSize = totalPlayers / 2;

    // Fetch player details
    const players = await sql`
      SELECT id, name, position, skill
      FROM players
      WHERE id = ANY(${playerIds})

    `;

    if (players.length !== playerIds.length) {
      return new Response(JSON.stringify({ error: 'One or more players not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate optimal squads
    // Generate optimal squads
    const startTime = Date.now();

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
        teamA: {
          players: teamA,
          totalSkill: teamASkill,
          fwSkill: teamAFWSkill,
          positions: getPositionBreakdown(teamA),
          gkCount: getGKCount(teamA),
        },
        teamB: {
          players: teamB,
          totalSkill: teamBSkill,
          fwSkill: teamBFWSkill,
          positions: getPositionBreakdown(teamB),
          gkCount: getGKCount(teamB),
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
