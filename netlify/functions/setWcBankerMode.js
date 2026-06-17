import { neon } from '@netlify/neon';

const sql = neon();

const VALID_MODES = ['admin', 'user'];

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
    const { mode } = JSON.parse(event.body);

    if (!VALID_MODES.includes(mode)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "mode must be 'admin' or 'user'" }),
      };
    }

    // Upsert the single settings row so this works even if it was never seeded.
    await sql`
      INSERT INTO wc_settings (id, banker_mode)
      VALUES (1, ${mode})
      ON CONFLICT (id) DO UPDATE SET banker_mode = ${mode}
    `;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Banker mode updated', banker_mode: mode }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
