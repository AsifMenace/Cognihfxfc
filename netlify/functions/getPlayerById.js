import { neon } from '@netlify/neon';
const sql = neon();

export const handler = async (event) => {
  // Handle CORS for StackBlitz/dev
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  try {
    const { id } = event.queryStringParameters;
    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing player ID' }),
      };
    }

    const result = await sql`
      SELECT 
        id,
        name,
        position,
        age,
        nationality,
        jersey_number AS "jerseyNumber",
        height,
        weight,
        goals,
        assists,
        appearances,
        photo,
        bio
      FROM players
      WHERE id = ${id}
      LIMIT 1
    `;

    if (result.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Player not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result[0]),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
