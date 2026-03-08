// functions/saveSquadGeneration.js
import { neon } from "@netlify/neon";

const sql = neon(process.env.DATABASE_URL);

function generateSignature(playerIds) {
  return playerIds
    .map((id) => id)
    .sort((a, b) => a - b)
    .join("-");
}

export default async (req, context) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
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
    const {
      generationDate,
      teamA,
      teamB,
      teamATotalSkill,
      teamBTotalSkill,
      teamAFWSkill,
      teamBFWSkill,
    } = body;

    // Validate required fields
    if (!generationDate || !teamA || !teamB) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: generationDate, teamA, teamB",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Generate signatures for duplicate detection
    const teamAPlayerIds = teamA.map((p) => p.id);
    const teamBPlayerIds = teamB.map((p) => p.id);
    const teamASignature = generateSignature(teamAPlayerIds);
    const teamBSignature = generateSignature(teamBPlayerIds);

    // Check if this squad already exists for today
    const existingSquad = await sql`
      SELECT id FROM squad_generations
      WHERE generation_date = ${generationDate}
      AND team_a_signature = ${teamASignature}
      AND team_b_signature = ${teamBSignature}
      LIMIT 1
    `;

    let result;
    let action;

    if (existingSquad && existingSquad.length > 0) {
      // Update existing squad
      const squadId = existingSquad[0].id;
      result = await sql`
        UPDATE squad_generations
        SET
          team_a_json = ${JSON.stringify(teamA)},
          team_b_json = ${JSON.stringify(teamB)},
          team_a_total_skill = ${teamATotalSkill},
          team_b_total_skill = ${teamBTotalSkill},
          team_a_fw_skill = ${teamAFWSkill},
          team_b_fw_skill = ${teamBFWSkill},
          status = 'created',
          updated_at = NOW()
        WHERE id = ${squadId}
        RETURNING id, generation_date, status, created_at, updated_at
      `;
      action = "updated";
    } else {
      // Create new squad
      result = await sql`
        INSERT INTO squad_generations (
          generation_date,
          team_a_json,
          team_b_json,
          team_a_signature,
          team_b_signature,
          team_a_total_skill,
          team_b_total_skill,
          team_a_fw_skill,
          team_b_fw_skill,
          status,
          created_at,
          updated_at
        )
        VALUES (
          ${generationDate},
          ${JSON.stringify(teamA)},
          ${JSON.stringify(teamB)},
          ${teamASignature},
          ${teamBSignature},
          ${teamATotalSkill},
          ${teamBTotalSkill},
          ${teamAFWSkill},
          ${teamBFWSkill},
          'created',
          NOW(),
          NOW()
        )
        RETURNING id, generation_date, status, created_at, updated_at
      `;
      action = "created";
    }

    const squad = result[0];

    return new Response(
      JSON.stringify({
        success: true,
        action,
        squad: {
          id: squad.id,
          generationDate: squad.generation_date,
          status: squad.status,
          createdAt: squad.created_at,
          updatedAt: squad.updated_at,
        },
        message:
          action === "created"
            ? "Squad saved successfully!"
            : "Squad updated successfully!",
      }),
      {
        status: action === "created" ? 201 : 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Error saving squad:", error);
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
