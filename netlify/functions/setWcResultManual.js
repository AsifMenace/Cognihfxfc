import { neon } from '@netlify/neon';

const sql = neon();

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { match_id, home_goals, away_goals } = JSON.parse(event.body);

    if (!match_id || home_goals === undefined || away_goals === undefined) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing match_id, home_goals, or away_goals' }),
      };
    }

    const hg = parseInt(home_goals, 10);
    const ag = parseInt(away_goals, 10);

    if (isNaN(hg) || isNaN(ag) || hg < 0 || ag < 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Goals must be non-negative integers' }),
      };
    }

    const matches = await sql`SELECT * FROM wc_matches WHERE id = ${match_id}`;
    if (matches.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Match not found' }),
      };
    }

    const match = matches[0];
    if (match.status === 'completed') {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Match is already completed. Cannot override.' }),
      };
    }

    let result;
    if (hg > ag) result = 'home';
    else if (ag > hg) result = 'away';
    else result = 'draw';

    await sql`
      UPDATE wc_matches
      SET result = ${result},
          status = 'completed',
          final_home_goals = ${hg},
          final_away_goals = ${ag}
      WHERE id = ${match_id}
    `;

    await sql`
      UPDATE wc_predictions
      SET points = CASE WHEN prediction = ${result} THEN 1 ELSE 0 END
      WHERE match_id = ${match_id}
    `;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Result set manually and points awarded',
        result,
        home_goals: hg,
        away_goals: ag,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
