import { validateAdmin } from './validateAdmin.js';
import { getAccessToken } from './youtubeClient.js';

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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { videoId, title } = JSON.parse(event.body);
    if (!videoId || !title || !title.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing videoId or title' }) };
    }

    const accessToken = await getAccessToken();
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    // videos.update replaces the whole snippet, not just the fields you send —
    // so fetch the current one first and swap only the title, or description/
    // tags/category would get wiped out.
    const getRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}`,
      { headers: authHeaders }
    );
    const getData = await getRes.json();
    if (!getRes.ok) throw new Error(getData.error?.message || 'Failed to load video');

    const video = getData.items?.[0];
    if (!video) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Video not found' }) };
    }

    const snippet = { ...video.snippet, title: title.trim() };

    const putRes = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet', {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: videoId, snippet }),
    });
    const putData = await putRes.json();
    if (!putRes.ok) throw new Error(putData.error?.message || 'Failed to update title');

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    const statusCode = err.code === 'not_connected' ? 409 : 500;
    return { statusCode, headers, body: JSON.stringify({ error: err.message, code: err.code }) };
  }
};
