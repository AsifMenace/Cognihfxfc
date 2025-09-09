import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async () => {
  try {
    const results = await sql`
      SELECT
        m.date,
        m.competition,
        t1.name AS home_team_name,
        t1.color AS home_team_color,
        t2.name AS away_team_name,
        t2.color AS away_team_color,
        m.result
      FROM matches m
      JOIN teams t1 ON m.home_team_id = t1.id
      JOIN teams t2 ON m.away_team_id = t2.id
      WHERE m.result IS NOT NULL
        AND m.competition ILIKE 'League%'
      ORDER BY m.date DESC, m.id DESC;
    `;

    // Just return raw results without grouping
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
