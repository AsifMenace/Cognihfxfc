import { neon } from '@netlify/neon';

const sql = neon();

export const handler = async (event) => {
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
    const sortBy = event.queryStringParameters?.sortBy || 'name';
    const order = event.queryStringParameters?.order || 'ASC';

    const allowedSortFields = [
      'name',
      'appearances',
      'goals',
      'assists',
      'position',
      'jersey_number',
      'age',
    ];
    const allowedOrders = ['ASC', 'DESC'];

    const validSortBy = allowedSortFields.includes(sortBy.toLowerCase())
      ? sortBy.toLowerCase()
      : 'name';
    const validOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

    const query = `
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
        saves,
        appearances,
        photo,
        bio,
        address,
        has_car AS "hasCar",
        contact,
        lat,
        lng
      FROM players
      ORDER BY ${validSortBy} ${validOrder}
    `;

    const players = await sql(query);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(players),
    };
  } catch (error) {
    console.error('Error fetching players:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
