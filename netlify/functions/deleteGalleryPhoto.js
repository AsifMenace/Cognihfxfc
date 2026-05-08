import { neon } from '@netlify/neon';
import { validateAdmin } from './validateAdmin.js';
const sql = neon();

export const handler = async (event) => {
  // Handle CORS preflight for DELETE
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
      },
      body: '',
    };
  }

  if (!validateAdmin(event)) {
    return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { id } = JSON.parse(event.body);

    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'ID is required' }),
      };
    }

    // Delete from DB
    await sql`DELETE FROM gallery WHERE id = ${id}`;

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Photo deleted successfully' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
