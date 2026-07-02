import { neon } from '@netlify/neon';

const sql = neon();

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  try {
    const rows = await sql`
      SELECT
        p.id          AS player_id,
        p.name        AS player_name,
        p.photo       AS player_photo,
        COUNT(wp.id)  AS exact_score_count,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'winner_flag', CASE WHEN m.result = 'home' THEN m.home_flag ELSE m.away_flag END,
            'winner_name', CASE WHEN m.result = 'home' THEN m.home_team ELSE m.away_team END
          )
          ORDER BY m.kickoff_time ASC
        ) AS exact_matches
      FROM players p
      JOIN wc_predictions wp ON wp.player_id = p.id
      JOIN wc_matches m ON m.id = wp.match_id
      WHERE wp.score_points > 0
        AND m.is_knockout = TRUE
        AND m.status = 'completed'
      GROUP BY p.id, p.name, p.photo
      ORDER BY COUNT(wp.id) DESC, p.name ASC
    `;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(rows),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
