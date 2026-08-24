import { neon } from '@netlify/neon';

const sql = neon();

const STAT_COLUMNS = {
  scorers: 'goals',
  assists: 'assists',
  saves: 'saves',
};

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
    const category = event.queryStringParameters?.category || 'scorers';
    const statColumn = STAT_COLUMNS[category];

    if (!statColumn) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'category must be one of: scorers, assists, saves' }),
      };
    }

    const rawLimit = Number(event.queryStringParameters?.limit);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 100) : 10;

    const query = `
      SELECT
        id,
        name,
        position,
        jersey_number AS "jerseyNumber",
        photo,
        appearances,
        ${statColumn} AS value
      FROM players
      WHERE ${statColumn} > 0
      ORDER BY ${statColumn} DESC, appearances ASC
      LIMIT ${limit}
    `;

    const results = await sql(query);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(results),
    };
  } catch (error) {
    console.error('Error fetching hall of fame data:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
