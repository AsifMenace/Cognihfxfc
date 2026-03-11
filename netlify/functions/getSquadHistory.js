// functions/getSquadHistory.js
import { neon } from "@netlify/neon";

const sql = neon(process.env.DATABASE_URL);

export default async (req, context) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch all squads created in the last 24 hours
    const squads = await sql`
      SELECT
        id,
        generation_date,
        team_a_json,
        team_b_json,
        team_a_total_skill,
        team_b_total_skill,
        team_a_fw_skill,
        team_b_fw_skill,
        status,
        match_id,
        created_at,
        linked_at
      FROM squad_generations
      WHERE deleted_at IS NULL
      AND created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 50
    `;

    // Format response
    const formattedSquads = squads.map((squad) => ({
      id: squad.id,
      generationDate: squad.generation_date,
      teamA: squad.team_a_json,
      teamB: squad.team_b_json,
      teamATotalSkill: squad.team_a_total_skill,
      teamBTotalSkill: squad.team_b_total_skill,
      teamAFWSkill: squad.team_a_fw_skill,
      teamBFWSkill: squad.team_b_fw_skill,
      status: squad.status,
      matchId: squad.match_id,
      createdAt: squad.created_at,
      linkedAt: squad.linked_at,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        squads: formattedSquads,
        total: formattedSquads.length,
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
    console.error("Error fetching squad history:", error);
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
