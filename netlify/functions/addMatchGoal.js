import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  try {
    const { match_id, team_id, player_id } = JSON.parse(event.body);

    if (!match_id || !team_id || !player_id) {
      return {
        statusCode: 400,
        body: "Missing match_id, team_id or player_id",
      };
    }

    await sql`
      INSERT INTO match_goals (match_id, team_id, player_id)
      VALUES (${match_id}, ${team_id}, ${player_id});
    `;
    // Increment the goals count for the player
    await sql`
      UPDATE players
      SET goals = goals + 1, appearances = appearances + 1
      WHERE id = ${player_id};
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Goal added and player goals updated successfully",
      }),
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
