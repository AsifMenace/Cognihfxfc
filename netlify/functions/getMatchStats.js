import { neon } from "@netlify/neon";

export async function handler(event) {
  const sql = neon();

  try {
    const { matchId } = event.queryStringParameters;

    if (!matchId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "matchId required" }),
      };
    }

    const stats = await sql`
      SELECT DISTINCT
        p.id, p.name, p.jersey_Number, p.position,
        COALESCE(SUM(pms.assists), 0) as assists,
        COALESCE(SUM(pms.saves), 0) as saves
      FROM players p
      LEFT JOIN player_match_stats pms ON pms.player_id = p.id AND pms.match_id = ${matchId}
      WHERE pms.assists > 0 OR pms.saves > 0
      GROUP BY p.id, p.name, p.jersey_Number, p.position
      ORDER BY assists DESC, saves DESC, p.jersey_Number ASC
    `;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(stats),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
