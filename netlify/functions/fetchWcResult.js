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
        body: JSON.stringify({ error: 'Missing match_id' }),
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

    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    const res = await fetch(`https://api.football-data.org/v4/matches/${match.fixture_id}`, {
      headers: { 'X-Auth-Token': apiKey },
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }

    const data = await res.json();
    const matchData = data.match ?? data; // v4 wraps in match key

    const matchStatus = matchData.status;

    // Only process if finished
    const finishedStatuses = ['FINISHED', 'AWARDED'];
    if (!finishedStatuses.includes(matchStatus)) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: `Match not finished yet. Current status: ${matchStatus}`,
          status: matchStatus,
        }),
      };
    }

    const homeGoals = matchData.score?.fullTime?.home ?? 0;
    const awayGoals = matchData.score?.fullTime?.away ?? 0;

    let result;
    if (homeGoals > awayGoals) result = 'home';
    else if (awayGoals > homeGoals) result = 'away';
    else result = 'draw';

    // Update match result and status
    await sql`
      UPDATE wc_matches
      SET result = ${result}, status = 'completed'
      WHERE id = ${match_id}
    `;

    // Award points - 1 for correct, 0 for wrong
    await sql`
      UPDATE wc_predictions
      SET points = CASE WHEN prediction = ${result} THEN 1 ELSE 0 END
      WHERE match_id = ${match_id}
    `;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Result fetched and points awarded',
        result,
        home_goals: homeGoals,
        away_goals: awayGoals,
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
