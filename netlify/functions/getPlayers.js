import { neon } from '@netlify/neon';

const sql = neon(); // Automatically uses NETLIFY_DATABASE_URL from your environment

export const handler = async () => {
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
      body: JSON.stringify(players),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
