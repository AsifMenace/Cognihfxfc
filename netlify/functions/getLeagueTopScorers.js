import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  // Handle CORS so it works in StackBlitz/dev
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  const limit = event.queryStringParameters?.limit
    ? Number(event.queryStringParameters.limit)
    : 5; // Default to 5
  try {
    const topScorers = await sql`
      SELECT
        players.id,
        players.name,
        players.position,
        COUNT(match_goals.id) AS goals,
        players.appearances,
        players.photo
      FROM match_goals
      JOIN players ON match_goals.player_id = players.id
      JOIN matches ON match_goals.match_id = matches.id
      WHERE matches.competition ILIKE 'League%'
      GROUP BY players.id, players.name, players.position, players.photo, players.appearances
      ORDER BY goals DESC, players.appearances ASC
      LIMIT ${limit};
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(topScorers),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
