// Shared helpers for talking to the YouTube Data API on behalf of the
// channel owner via a stored OAuth refresh token (see youtubeAuthCallback.js).
//
// The refresh token lives in the database, not an env var — the Google Cloud
// OAuth app is in "Testing" status, so refresh tokens expire after 7 days of
// inactivity and need re-connecting periodically. Storing it in the DB means
// reconnecting takes effect immediately, no env var edit + redeploy required.

import { neon } from '@netlify/neon';

const sql = neon();
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS youtube_auth (
      id INT PRIMARY KEY DEFAULT 1,
      refresh_token TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export async function saveRefreshToken(refreshToken) {
  await ensureTable();
  await sql`
    INSERT INTO youtube_auth (id, refresh_token, updated_at)
    VALUES (1, ${refreshToken}, now())
    ON CONFLICT (id) DO UPDATE SET refresh_token = EXCLUDED.refresh_token, updated_at = now()
  `;
}

async function getStoredRefreshToken() {
  await ensureTable();
  const rows = await sql`SELECT refresh_token FROM youtube_auth WHERE id = 1`;
  if (rows[0]?.refresh_token) return rows[0].refresh_token;

  // One-time migration: the token used to live in an env var (before this file
  // switched to DB storage). If it's still there and still valid, adopt it into
  // the DB so this switch doesn't force an unnecessary reconnect.
  if (process.env.YOUTUBE_REFRESH_TOKEN) {
    await saveRefreshToken(process.env.YOUTUBE_REFRESH_TOKEN);
    return process.env.YOUTUBE_REFRESH_TOKEN;
  }

  return null;
}

export function redirectUri() {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  return `${base}/.netlify/functions/youtubeAuthCallback`;
}

export async function getAccessToken() {
  const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET } = process.env;
  const refreshToken = await getStoredRefreshToken();

  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !refreshToken) {
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
      refresh_token: refreshToken,
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
