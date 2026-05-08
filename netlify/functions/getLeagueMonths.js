import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async () => {
  try {
    const rows = await sql`
      SELECT DISTINCT TO_CHAR(date::date, 'YYYY-MM') AS month
      FROM matches
      WHERE home_team_id IS NOT NULL
        AND away_team_id IS NOT NULL
      ORDER BY month DESC
    `;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(rows.map((r) => r.month)),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
