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
    const { match_id, player_ids, team_id } = JSON.parse(event.body);

    // Validate all required parameters
    if (
      !match_id ||
      !player_ids ||
      !Array.isArray(player_ids) ||
      player_ids.length === 0 ||
      !team_id
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "match_id, player_ids (non-empty array) and team_id are required",
        }),
      };
    }

    // Loop through each player_id and insert or update
    for (const player_id of player_ids) {
      if (!player_id) continue; // Skip falsy values

      await sql`
        INSERT INTO match_players (match_id, player_id, team_id)
        VALUES (${match_id}, ${player_id}, ${team_id})
        ON CONFLICT (match_id, player_id) DO UPDATE SET team_id = EXCLUDED.team_id
      `;

      await sql`
      UPDATE players
      SET appearances = appearances + 1
      WHERE id = ${player_id};
    `;
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Players added to match lineup" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
