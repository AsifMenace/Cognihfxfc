import { neon } from "@netlify/neon";

const sql = neon(process.env.DATABASE_URL);

export default async (req, context) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { squadId, matchId, teamAAssignedTo, teamBAssignedTo, teamA, teamB } =
      body;

    // Validate input
    if (
      !squadId ||
      !matchId ||
      !teamAAssignedTo ||
      !teamBAssignedTo ||
      !teamA ||
      !teamB
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: squadId, matchId, teamAAssignedTo, teamBAssignedTo, teamA, teamB",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate that both teams are not assigned to the same team
    if (teamAAssignedTo === teamBAssignedTo) {
      return new Response(
        JSON.stringify({
          error: "Cannot assign both squads to the same team",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get match details
    const match = await sql`
      SELECT id, home_team_id, away_team_id
      FROM matches
      WHERE id = ${matchId}
      LIMIT 1
    `;

    if (!match || match.length === 0) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const matchData = match[0];

    // Get squad details
    const squad = await sql`
      SELECT id, team_a_json, team_b_json, status, match_id
      FROM squad_generations
      WHERE id = ${squadId}
      AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!squad || squad.length === 0) {
      return new Response(JSON.stringify({ error: "Squad not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert team name/ID to team_id from database
    let teamAId, teamBId;

    if (!isNaN(teamAAssignedTo) && !isNaN(teamBAssignedTo)) {
      teamAId = parseInt(teamAAssignedTo);
      teamBId = parseInt(teamBAssignedTo);
    } else {
      // Assume they are team names, fetch IDs
      const teams = await sql`
        SELECT id, name FROM teams
        WHERE name ILIKE ${teamAAssignedTo} OR name ILIKE ${teamBAssignedTo}
      `;

      const teamMap = {};
      teams.forEach((t) => {
        teamMap[t.name.toLowerCase()] = t.id;
      });

      teamAId = teamMap[teamAAssignedTo.toLowerCase()];
      teamBId = teamMap[teamBAssignedTo.toLowerCase()];

      if (!teamAId || !teamBId) {
        return new Response(
          JSON.stringify({ error: "One or more teams not found" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // ============================================================================
    // CLEAN DELETION LOGIC - Simple and reliable
    // ============================================================================

    // Step 1: Always delete ALL existing match_players for this match FIRST
    await sql`
      DELETE FROM match_players
      WHERE match_id = ${matchId}
    `;

    // Step 2: Unlink any squad previously linked to this match (except current squad)
    await sql`
      UPDATE squad_generations
      SET
        match_id = NULL,
        status = 'created',
        linked_at = NULL
      WHERE match_id = ${matchId}
      AND id != ${squadId}
    `;

    // ============================================================================
    // INSERT NEW PLAYERS
    // ============================================================================

    // Step 3: Insert new match_players records for Team A
    const teamAInserts = teamA.map((player) => ({
      match_id: matchId,
      player_id: player.id,
      team_id: teamAId,
    }));

    for (const record of teamAInserts) {
      await sql`
        INSERT INTO match_players (match_id, player_id, team_id)
        VALUES (${record.match_id}, ${record.player_id}, ${record.team_id})
      `;
    }

    // Step 4: Insert new match_players records for Team B
    const teamBInserts = teamB.map((player) => ({
      match_id: matchId,
      player_id: player.id,
      team_id: teamBId,
    }));

    for (const record of teamBInserts) {
      await sql`
        INSERT INTO match_players (match_id, player_id, team_id)
        VALUES (${record.match_id}, ${record.player_id}, ${record.team_id})
      `;
    }

    // Step 5: Update squad_generations to mark as linked
    const updatedSquad = await sql`
      UPDATE squad_generations
      SET
        match_id = ${matchId},
        status = 'linked',
        linked_at = NOW(),
        updated_at = NOW()
      WHERE id = ${squadId}
      RETURNING id, match_id, status, linked_at
    `;

    return new Response(
      JSON.stringify({
        success: true,
        squad: updatedSquad[0],
        message: "Squad linked to match successfully!",
        details: {
          squadId,
          matchId,
          teamAPlayers: teamA.length,
          teamBPlayers: teamB.length,
          totalPlayersLinked: teamA.length + teamB.length,
          teamAAssignedTo,
          teamBAssignedTo,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Error linking squad to match:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
};