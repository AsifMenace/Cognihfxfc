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
    const { match_id } = JSON.parse(event.body);

    if (!match_id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required field: match_id' }),
      };
    }

    // Check if this match exists
    const matches = await sql`
      SELECT id, status, home_team, away_team
      FROM wc_matches
      WHERE id = ${match_id}
    `;

    if (!matches || matches.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Match not found' }),
      };
    }

    const match = matches[0];

    // Check if anyone has made predictions for this match
    const predictions = await sql`
      SELECT COUNT(*) as prediction_count
      FROM wc_predictions
      WHERE match_id = ${match_id}
    `;

    const predictionCount = predictions[0]?.prediction_count || 0;

    if (predictionCount > 0) {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Cannot deactivate match with existing predictions (${predictionCount} prediction(s) found)`,
          predictionCount,
          match: {
            id: match.id,
            homeTeam: match.home_team,
            awayTeam: match.away_team,
            status: match.status,
          },
        }),
      };
    }

    // No predictions exist, safe to deactivate.
    // Update status to 'upcoming' and release any banker designation so the day's
    // banker can be reassigned to another match (see activateWcMatch.js).
    await sql`
      UPDATE wc_matches
      SET status = 'upcoming', is_banker_match = FALSE
      WHERE id = ${match_id}
    `;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: `Match ${match.home_team} vs ${match.away_team} deactivated successfully (no predictions were made)`,
        match: {
          id: match.id,
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          newStatus: 'upcoming',
        },
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
