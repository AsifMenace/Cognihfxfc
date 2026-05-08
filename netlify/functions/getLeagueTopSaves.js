import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
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

  const currentMonth = new Date().toISOString().slice(0, 7);
  const month = event.queryStringParameters?.month || currentMonth;
  const limit = event.queryStringParameters?.limit
    ? Number(event.queryStringParameters.limit)
    : 10;

  try {
    const topSavers = await sql`
      SELECT
        players.id,
        players.name,
        players.position,
        COALESCE(SUM(player_match_stats.saves), 0) AS saves,
        players.photo
      FROM player_match_stats
      JOIN players ON player_match_stats.player_id = players.id
      JOIN matches ON player_match_stats.match_id = matches.id
      WHERE matches.home_team_id IS NOT NULL
        AND matches.away_team_id IS NOT NULL
        AND TO_CHAR(matches.date::date, 'YYYY-MM') = ${month}
      GROUP BY players.id, players.name, players.position, players.photo
      HAVING COALESCE(SUM(player_match_stats.saves), 0) > 0
      ORDER BY saves DESC
      LIMIT ${limit}
    `;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(topSavers),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
