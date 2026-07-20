import { neon } from "@netlify/neon";
import { validateAdmin } from "./validateAdmin.js";
import { recomputeMatchResult } from "./recomputeMatchResult.js";
const sql = neon();

export const handler = async (event) => {
  if (!validateAdmin(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }), headers: { "Access-Control-Allow-Origin": "*" } };
  }

  try {
    const { goal_id, player_id } = JSON.parse(event.body);

    if (!goal_id || !player_id) {
      return {
        statusCode: 400,
        body: "Missing goal_id or player_id",
      };
    }

    // Delete the goal entry
    const deleted = await sql`
      DELETE FROM match_goals WHERE id = ${goal_id} RETURNING match_id;
    `;

    // Decrement player's goals count safely
    await sql`
      UPDATE players
      SET goals = GREATEST(goals - 1, 0)
      WHERE id = ${player_id};
    `;

    const result = deleted.length
      ? await recomputeMatchResult(sql, deleted[0].match_id)
      : null;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, result }),
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  }
};
