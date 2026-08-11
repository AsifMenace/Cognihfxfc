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

  try {
    const accessToken = await getAccessToken();
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
      { headers: authHeaders }
    );
    const channelData = await channelRes.json();
    if (!channelRes.ok) throw new Error(channelData.error?.message || 'Failed to load channel');

    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      return { statusCode: 200, headers, body: JSON.stringify({ videos: [] }) };
    }

    const itemsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${uploadsPlaylistId}`,
      { headers: authHeaders }
    );
    const itemsData = await itemsRes.json();
    if (!itemsRes.ok) throw new Error(itemsData.error?.message || 'Failed to load videos');

    const videos = (itemsData.items || []).map((item) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.default?.url || '',
      publishedAt: item.snippet.publishedAt,
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ videos }) };
  } catch (err) {
    const statusCode = err.code === 'not_connected' ? 409 : 500;
    return { statusCode, headers, body: JSON.stringify({ error: err.message, code: err.code }) };
  }
};
