import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const match_id = event.queryStringParameters?.match_id;

    if (!match_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "match_id query parameter is required" }),
      };
    }

    const lineup = await sql`
      SELECT p.*
      FROM players p
      JOIN match_players mp ON p.id = mp.player_id
      WHERE mp.match_id = ${match_id}
      ORDER BY p.jersey_number ASC
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(lineup),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
