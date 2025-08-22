import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { match_id, player_id } = JSON.parse(event.body);

    if (!match_id || !player_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "match_id and player_id are required" }),
      };
    }

    await sql`
      INSERT INTO match_players (match_id, player_id)
      VALUES (${match_id}, ${player_id})
      ON CONFLICT DO NOTHING
    `;

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Player added to match lineup" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
