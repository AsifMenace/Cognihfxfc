import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod !== "DELETE") {
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
      DELETE FROM match_players
      WHERE match_id = ${match_id} AND player_id = ${player_id}
    `;

    // Fetch updated lineup
    const lineup = await sql`
  SELECT mp.*, p.name, p.photo, p.position, p.jerseyNumber
  FROM match_players mp
  JOIN players p ON p.id = mp.player_id
  WHERE mp.match_id = ${match_id}
`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Player removed from match lineup",
        lineup,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
