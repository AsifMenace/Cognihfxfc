import { neon } from '@netlify/neon';
const sql = neon();

export const handler = async () => {
  try {
    const rows = await sql`SELECT * FROM gallery ORDER BY uploaded_at DESC;`;
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(rows),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
