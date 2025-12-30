// /.netlify/functions/addPlayerMatchStats.js (renamed)
import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
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
        saves = (SELECT COALESCE(SUM(saves), 0) FROM player_match_stats WHERE player_id = ${playerId}),
        assists = (SELECT COALESCE(SUM(assists), 0) FROM player_match_stats WHERE player_id = ${playerId})
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
