import { neon } from "@netlify/neon";
import { validateAdmin } from "./validateAdmin.js";

const sql = neon();

export const handler = async (event) => {
  if (!validateAdmin(event)) {
    return {
      statusCode: 401,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  if (event.httpMethod !== "DELETE") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const { matchId } = JSON.parse(event.body || "{}");

  if (!matchId) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "matchId is required" }),
    };
  }

  try {
    // 1. Delete match goals
    await sql`DELETE FROM match_goals WHERE match_id = ${matchId}`;

    // 2. Decrement appearances for all players in this match before deleting
    const matchPlayers = await sql`SELECT player_id FROM match_players WHERE match_id = ${matchId}`;
    if (matchPlayers.length > 0) {
      const playerIds = matchPlayers.map((p) => p.player_id);
      await sql`
        UPDATE players
        SET appearances = GREATEST(0, COALESCE(appearances, 0) - 1)
        WHERE id = ANY(${playerIds})
      `;
    }

    // 3. Delete match players
    await sql`DELETE FROM match_players WHERE match_id = ${matchId}`;

    // 4. Delete player match stats
    await sql`DELETE FROM player_match_stats WHERE match_id = ${matchId}`;

    // 5. Delete player of the match
    await sql`DELETE FROM playerofthematch WHERE match_id = ${matchId}`;

    // 6. Unlink squad generations (preserve squad history, just remove the link)
    await sql`
      UPDATE squad_generations
      SET match_id = NULL, status = 'created', linked_at = NULL, updated_at = NOW()
      WHERE match_id = ${matchId}
    `;

    // 7. Delete the match itself
    await sql`DELETE FROM matches WHERE id = ${matchId}`;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true, message: "Match deleted successfully" }),
    };
  } catch (err) {
    console.error("deleteMatch error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
