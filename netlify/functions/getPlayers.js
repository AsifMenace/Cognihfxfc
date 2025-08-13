import { neon } from '@netlify/neon';

const sql = neon(); // Automatically uses NETLIFY_DATABASE_URL from your environment

export const handler = async (event) => {
  // Handle preflight OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',  // allow all origins, or replace * with your site URL
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  try {
    const players = await sql`
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
      ORDER BY name ASC;
    `;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(players),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
