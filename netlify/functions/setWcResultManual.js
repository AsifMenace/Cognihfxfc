import { neon } from '@netlify/neon';
import { cancelJob } from './autoFetchWcResult.js';

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
    const { match_id, home_goals, away_goals, penalty_winner, override } = JSON.parse(event.body);

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
    // A completed match can only be re-scored with an explicit override (used to
    // correct a wrong API/manual result). The point recompute below is a full,
    // idempotent re-score of the match, so overriding is safe.
    if (match.status === 'completed' && override !== true) {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Match is already completed. Pass override to correct it.' }),
      };
    }

    let result;
    if (hg > ag) result = 'home';
    else if (ag > hg) result = 'away';
    else if (match.is_knockout) {
      if (penalty_winner !== 'home' && penalty_winner !== 'away') {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Knockout match with equal score requires penalty_winner (home|away)' }),
        };
      }
      result = penalty_winner;
    } else {
      result = 'draw';
    }

    await sql`
      UPDATE wc_matches
      SET result = ${result},
          status = 'completed',
          final_home_goals = ${hg},
          final_away_goals = ${ag},
          cronjob_id = NULL
      WHERE id = ${match_id}
    `;

    if (match.is_knockout) {
      // Knockout: winner points (banker doubles) + flat score bonus (no banker effect)
      await sql`
        UPDATE wc_predictions
        SET points = CASE
          WHEN predicted_winner = ${result} THEN (CASE WHEN is_banker THEN 2 ELSE 1 END)
          ELSE (CASE WHEN is_banker THEN -2 ELSE 0 END)
        END
        WHERE match_id = ${match_id}
      `;
      await sql`
        UPDATE wc_predictions
        SET score_points = CASE
          WHEN predicted_home_goals = ${hg} AND predicted_away_goals = ${ag} THEN 5
          ELSE 0
        END
        WHERE match_id = ${match_id}
      `;
    } else {
      await sql`
        UPDATE wc_predictions
        SET points = CASE
          WHEN prediction = ${result} THEN (CASE WHEN is_banker THEN 2 ELSE 1 END)
          ELSE (CASE WHEN is_banker THEN -1 ELSE 0 END)
        END
        WHERE match_id = ${match_id}
      `;
    }

    // Cancel the pending auto-fetch cron job now that the result is set manually.
    await cancelJob(match.cronjob_id);

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
