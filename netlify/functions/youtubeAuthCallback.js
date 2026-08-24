import { redirectUri, saveRefreshToken } from './youtubeClient.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

const page = (title, bodyHtml) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
  body: `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;padding:40px 20px;max-width:640px;margin:0 auto;line-height:1.6}
  code{background:#1e293b;padding:8px 12px;border-radius:8px;color:#fbbf24;word-break:break-all;display:inline-block;margin-top:8px}
  h1{color:#fbbf24}
  a{color:#fbbf24}
</style></head><body>${bodyHtml}</body></html>`,
});

export const handler = async (event) => {
  const code = event.queryStringParameters?.code;
  const errorParam = event.queryStringParameters?.error;

  if (errorParam) {
    return page('YouTube connection failed', `<h1>Connection failed</h1><p>Google returned: <code>${errorParam}</code></p>`);
  }

  if (!code) {
    return page('YouTube connection failed', `<h1>Missing code</h1><p>No authorization code was returned by Google.</p>`);
  }

  const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET } = process.env;
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
    return page('YouTube connection failed', `<h1>Not configured</h1><p>YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET are missing on the server.</p>`);
  }

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return page('YouTube connection failed', `<h1>Token exchange failed</h1><p>${data.error_description || data.error}</p>`);
    }

    if (!data.refresh_token) {
      return page(
        'Almost there',
        `<h1>No refresh token returned</h1>
         <p>Google only issues a refresh token on the <em>first</em> consent for a given account/app pair.
         Go to <a href="https://myaccount.google.com/permissions">Google Account &rarr; Security &rarr; Third-party access</a>,
         remove access for this app, then try connecting again.</p>`
      );
    }

    await saveRefreshToken(data.refresh_token);

    return page(
      'YouTube connected',
      `<h1>YouTube connected</h1>
       <p>You're all set — the app can now manage thumbnails, links, and titles on your channel. No env vars or redeploy needed.</p>
       <p style="margin-top:24px">You can close this tab.</p>`
    );
  } catch (err) {
    return page('YouTube connection failed', `<h1>Unexpected error</h1><p>${err.message}</p>`);
  }
};
