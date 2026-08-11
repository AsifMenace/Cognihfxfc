import { validateAdmin } from './validateAdmin.js';
import { redirectUri } from './youtubeClient.js';

// Read-only access to list channel videos, plus force-ssl (required to write thumbnails).
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

export const handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*' };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { ...headers, 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token' },
      body: '',
    };
  }

  if (!validateAdmin(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const { YOUTUBE_CLIENT_ID } = process.env;
  if (!YOUTUBE_CLIENT_ID) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'YOUTUBE_CLIENT_ID is not configured' }) };
  }

  const params = new URLSearchParams({
    client_id: YOUTUBE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` }),
  };
};
