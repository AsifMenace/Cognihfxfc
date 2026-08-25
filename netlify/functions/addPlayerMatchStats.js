import { neon } from "@netlify/neon";
import { validateAdmin } from "./validateAdmin.js";

const sql = neon();

export const handler = async (event) => {
  if (!validateAdmin(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const {
      playerId,
      matchId,
      saves = 0,
      assists = 0,
    } = JSON.parse(event.body);

    if (!playerId || !matchId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "playerId and matchId required" }),
      };
    }

    // Validate: saves only for GKs, assists for everyone
    const player =
      await sql`SELECT position FROM players WHERE id = ${playerId}`;
    if (!player[0]) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Player not found" }),
      };
    }

    if (
      saves > 0 &&
      !player[0].position?.toLowerCase().includes("Goalkeeper") &&
      !player[0].position?.toLowerCase().includes("keeper") &&
      !player[0].position?.toLowerCase().includes("goal")
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Saves can only be recorded for goalkeepers",
        }),
      };
    }

    if (assists < 0 || saves < 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Stats cannot be negative" }),
      };
    }

    // Look up what was previously recorded for this match so we can apply
    // just the difference to the player's total, instead of overwriting it
    // with a recomputed sum (which would wipe out any manually-adjusted total).
    const existing = await sql`
      SELECT saves, assists FROM player_match_stats
      WHERE player_id = ${playerId} AND match_id = ${matchId}
    `;
    const savesDelta = saves - (existing[0]?.saves ?? 0);
    const assistsDelta = assists - (existing[0]?.assists ?? 0);

    // Upsert both stats
    await sql`
      INSERT INTO player_match_stats (player_id, match_id, saves, assists)
      VALUES (${playerId}, ${matchId}, ${saves}, ${assists})
      ON CONFLICT (player_id, match_id)
      DO UPDATE SET
        saves = ${saves},
        assists = ${assists},
        updated_at = NOW()
    `;

    // Update totals in players table
    await sql`
      UPDATE players
      SET
        saves = saves + ${savesDelta},
        assists = assists + ${assistsDelta}
      WHERE id = ${playerId}
    `;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
