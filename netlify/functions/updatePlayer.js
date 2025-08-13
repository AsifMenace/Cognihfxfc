import { neon } from '@netlify/neon';

const sql = neon();

export const handler = async (event) => {
  // Handle CORS preflight for dev environments
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    const {
      id,
      name,
      position,
      age,
      nationality,
      jerseyNumber,
      height,
      weight,
      goals,
      assists,
      appearances,
      photo,
      bio,
    } = data;

    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing player ID for update' }),
      };
    }

    // Update statement with only provided fields, or you can update all fields
    await sql`
      UPDATE players
      SET 
        name = ${name},
        position = ${position},
        age = ${age},
        nationality = ${nationality},
        jersey_number = ${jerseyNumber},
        height = ${height},
        weight = ${weight},
        goals = ${goals},
        assists = ${assists},
        appearances = ${appearances},
        photo = ${photo},
        bio = ${bio}
      WHERE id = ${id};
    `;

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Player updated successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
