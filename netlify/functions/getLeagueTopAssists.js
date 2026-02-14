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
    : 10; // Default to 10
  try {
    const topAssisters = await sql`
      SELECT
        players.id,
        players.name,
        players.position,
        COALESCE(SUM(player_match_stats.assists), 0) AS assists,
        players.photo
      FROM player_match_stats
      JOIN players ON player_match_stats.player_id = players.id
      JOIN matches ON player_match_stats.match_id = matches.id
      WHERE matches.competition ILIKE 'League%'
      GROUP BY players.id, players.name, players.position, players.photo
      HAVING COALESCE(SUM(player_match_stats.assists), 0) > 0
      ORDER BY assists DESC
      LIMIT ${limit};
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(topAssisters),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
