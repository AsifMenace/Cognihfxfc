import { signToken } from './sessionToken.js';

export const handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  let password;
  try {
    ({ password } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid password' }) };
  }

  try {
    const token = signToken();
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, token }) };
  } catch {
    // SESSION_SECRET missing/misconfigured — surface as a server error, not a bad password.
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Auth not configured' }) };
  }
};
