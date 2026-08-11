// Free stock photo backdrop for the thumbnail generator (Pexels API).
// Keeps PEXELS_API_KEY server-side so it never ships in the client bundle.

const QUERIES = [
  'soccer stadium night',
  'football match action',
  'soccer field aerial',
  'football stadium lights',
  'soccer players action',
];

export const handler = async (event) => {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'PEXELS_API_KEY is not configured' }),
    };
  }

  const query = event.queryStringParameters?.query || QUERIES[Math.floor(Math.random() * QUERIES.length)];

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );

    if (!res.ok) {
      throw new Error(`Pexels API error ${res.status}`);
    }

    const data = await res.json();
    const photos = data.photos || [];
    if (photos.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: `No photos found for "${query}"` }),
      };
    }

    const photo = photos[Math.floor(Math.random() * photos.length)];

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        url: photo.src.large2x || photo.src.landscape || photo.src.large,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
