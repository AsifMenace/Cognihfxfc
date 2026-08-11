import { validateAdmin } from './validateAdmin.js';
import { getAccessToken } from './youtubeClient.js';

const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024; // YouTube's hard limit

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
    const { videoId, imageBase64 } = JSON.parse(event.body);
    if (!videoId || !imageBase64) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing videoId or imageBase64' }) };
    }

    const imageBuffer = Buffer.from(imageBase64, 'base64');
    if (imageBuffer.length > MAX_THUMBNAIL_BYTES) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Image exceeds YouTube's 2MB thumbnail limit" }),
      };
    }

    const accessToken = await getAccessToken();

    const res = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(videoId)}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'image/jpeg' },
        body: imageBuffer,
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to set thumbnail');
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    const statusCode = err.code === 'not_connected' ? 409 : 500;
    return { statusCode, headers, body: JSON.stringify({ error: err.message, code: err.code }) };
  }
};
