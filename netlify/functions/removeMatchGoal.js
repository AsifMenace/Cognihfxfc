import { neon } from "@netlify/neon";
const sql = neon();

export const handler = async (event) => {
  try {
    const { goal_id, player_id } = JSON.parse(event.body);

    if (!goal_id || !player_id) {
      return {
        statusCode: 400,
        body: "Missing goal_id or player_id",
      };
    }

    // Delete the goal entry
    await sql`DELETE FROM match_goals WHERE id = ${goal_id};`;

    // Decrement player's goals count safely
    await sql`
      UPDATE players
      SET goals = GREATEST(goals - 1, 0), appearances = GREATEST(appearances - 1, 0)
      WHERE id = ${player_id};
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
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
