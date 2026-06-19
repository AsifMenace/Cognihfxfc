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
    const { match_id, answer_index } = JSON.parse(event.body);

    if (!match_id || answer_index === undefined || answer_index === null) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing match_id or answer_index' }),
      };
    }

    const answer = parseInt(answer_index, 10);
    if (isNaN(answer) || answer < -1) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'answer_index must be -1 (none) or a 0-based option index' }),
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
    if (!match.trivia_question || !match.trivia_options) {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'This match has no trivia question' }),
      };
    }

    // Validate the index falls within the authored options (or -1 for "none").
    let optionCount = 0;
    try {
      const opts = JSON.parse(match.trivia_options);
      if (Array.isArray(opts)) optionCount = opts.length;
    } catch {
      optionCount = 0;
    }
    if (answer >= optionCount) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'answer_index is out of range for this question' }),
      };
    }

    // Store the answer and (re)award points. answer = -1 ("none") awards nobody.
    await sql`UPDATE wc_matches SET trivia_answer = ${answer} WHERE id = ${match_id}`;
    await sql`
      UPDATE wc_predictions
      SET trivia_points = CASE
        WHEN ${answer} >= 0 AND trivia_guess = ${answer} THEN 1
        ELSE 0
      END
      WHERE match_id = ${match_id}
    `;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: answer === -1 ? 'Trivia voided (none of the options)' : 'Trivia answer set and points awarded',
        trivia_answer: answer,
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
