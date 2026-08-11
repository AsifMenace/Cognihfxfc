// Shared helpers for talking to the YouTube Data API on behalf of the
// channel owner via a stored OAuth refresh token (see youtubeAuthCallback.js).

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export function redirectUri() {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  return `${base}/.netlify/functions/youtubeAuthCallback`;
}

export async function getAccessToken() {
  const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = process.env;
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    const err = new Error('YouTube is not connected yet');
    err.code = 'not_connected';
    throw err;
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      refresh_token: YOUTUBE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error_description || data.error || 'Failed to refresh YouTube access token');
    // A revoked/expired refresh token (e.g. 7-day expiry in OAuth "Testing" mode)
    // surfaces here as invalid_grant — treat it the same as "not connected".
    if (data.error === 'invalid_grant') err.code = 'not_connected';
    throw err;
  }
  return data.access_token;
}
