import { neon } from '@netlify/neon';

const sql = neon();

async function geocodeAddress(address) {
  const query = encodeURIComponent(`${address}, Halifax, Nova Scotia`);
  const url = `https://photon.komoot.io/api/?q=${query}&limit=1&lang=en`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.features || data.features.length === 0) {
    throw new Error(`No geocoding results found for address: ${address}`);
  }

  const [lng, lat] = data.features[0].geometry.coordinates;
  return { lat, lng };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    const {
      name,
      position,
      age,
      nationality,
      jerseyNumber,
      height,
      weight,
      goals,
      assists,
      appearances,
      photo,
      skill,
      bio,
      address,
      hasCar,
      contact,
    } = data;

    if (!name || !position || !age || !nationality || !jerseyNumber) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const DEFAULT_IMG =
      'https://res.cloudinary.com/mycloudasif/image/upload/v1756276511/abc_ivaom4.jpg';
    const playerPhoto = photo && photo.trim() !== '' ? photo : DEFAULT_IMG;

    // Geocode if address provided
    let lat = null;
    let lng = null;
    if (address && address.trim() !== '') {
      try {
        const coords = await geocodeAddress(address.trim());
        lat = coords.lat;
        lng = coords.lng;
      } catch (geoError) {
        return {
          statusCode: 422,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            error: `Geocoding failed: ${geoError.message}. Check the address and try again.`,
          }),
        };
      }
    }

    await sql`
      INSERT INTO players
        (name, position, age, nationality, jersey_number, height, weight, goals, assists, appearances, skill, photo, bio, address, has_car, contact, lat, lng)
      VALUES
        (${name}, ${position}, ${age}, ${nationality}, ${jerseyNumber}, ${height}, ${weight}, ${goals || 0}, ${assists || 0}, ${appearances || 0}, ${skill || null}, ${playerPhoto}, ${bio || ''}, ${address || null}, ${hasCar ?? false}, ${contact || null}, ${lat}, ${lng});
    `;

    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Player added successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
