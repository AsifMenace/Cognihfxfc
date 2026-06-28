import { neon } from '@netlify/neon';

const sql = neon();

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const leaderboard = await sql`
      SELECT
        p.id AS player_id,
        p.name AS player_name,
        p.photo AS player_photo,
        COALESCE(SUM(wp.points), 0) + COALESCE(SUM(wp.score_points), 0) + COALESCE(SUM(wp.trivia_points), 0) AS total_points,
        COUNT(wp.id) AS predictions_made,
        COUNT(CASE WHEN wp.points > 0 THEN 1 END) AS correct_predictions
      FROM players p
      INNER JOIN wc_predictions wp ON wp.player_id = p.id
      GROUP BY p.id, p.name, p.photo
      HAVING COUNT(wp.id) > 0
      ORDER BY total_points DESC, correct_predictions DESC, p.name ASC
    `;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(leaderboard),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
