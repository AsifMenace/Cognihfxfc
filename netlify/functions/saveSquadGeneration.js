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
    // One-time idempotent migration for 3-squad columns
    await sql`
      ALTER TABLE squad_generations
        ADD COLUMN IF NOT EXISTS team_c_json JSONB,
        ADD COLUMN IF NOT EXISTS team_c_signature TEXT,
        ADD COLUMN IF NOT EXISTS team_c_total_skill INTEGER,
        ADD COLUMN IF NOT EXISTS team_c_fw_skill INTEGER
    `;

    const body = await req.json();
    const {
      generationDate,
      teamA,
      teamB,
      teamC = null,
      teamATotalSkill,
      teamBTotalSkill,
      teamCTotalSkill = null,
      teamAFWSkill,
      teamBFWSkill,
      teamCFWSkill = null,
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
    const teamASignature = generateSignature(teamA.map((p) => p.id));
    const teamBSignature = generateSignature(teamB.map((p) => p.id));
    const teamCSignature = teamC ? generateSignature(teamC.map((p) => p.id)) : null;

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
      const squadId = existingSquad[0].id;
      result = await sql`
        UPDATE squad_generations
        SET
          team_a_json = ${JSON.stringify(teamA)},
          team_b_json = ${JSON.stringify(teamB)},
          team_c_json = ${teamC ? JSON.stringify(teamC) : null},
          team_a_total_skill = ${teamATotalSkill},
          team_b_total_skill = ${teamBTotalSkill},
          team_c_total_skill = ${teamCTotalSkill},
          team_a_fw_skill = ${teamAFWSkill},
          team_b_fw_skill = ${teamBFWSkill},
          team_c_fw_skill = ${teamCFWSkill},
          team_c_signature = ${teamCSignature},
          status = 'created',
          updated_at = NOW()
        WHERE id = ${squadId}
        RETURNING id, generation_date, status, created_at, updated_at
      `;
      action = "updated";
    } else {
      result = await sql`
        INSERT INTO squad_generations (
          generation_date,
          team_a_json,
          team_b_json,
          team_c_json,
          team_a_signature,
          team_b_signature,
          team_c_signature,
          team_a_total_skill,
          team_b_total_skill,
          team_c_total_skill,
          team_a_fw_skill,
          team_b_fw_skill,
          team_c_fw_skill,
          status,
          created_at,
          updated_at
        )
        VALUES (
          ${generationDate},
          ${JSON.stringify(teamA)},
          ${JSON.stringify(teamB)},
          ${teamC ? JSON.stringify(teamC) : null},
          ${teamASignature},
          ${teamBSignature},
          ${teamCSignature},
          ${teamATotalSkill},
          ${teamBTotalSkill},
          ${teamCTotalSkill},
          ${teamAFWSkill},
          ${teamBFWSkill},
          ${teamCFWSkill},
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
