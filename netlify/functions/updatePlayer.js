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

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    const {
      id,
      name,
      position,
      age,
      nationality,
      jerseyNumber,
      height,
      weight,
      goals,
      assists,
      saves,
      appearances,
      photo,
      bio,
      skill,
      address,
      hasCar,
      contact,
    } = data;

    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing player ID for update' }),
      };
    }

    // Fetch current address from DB to compare
    const current = await sql`SELECT address FROM players WHERE id = ${id}`;
    const currentAddress = current[0]?.address ?? null;

    // Geocode only if address is non-empty and different from what's stored
    let lat = null;
    let lng = null;
    const addressChanged =
      address && address.trim() !== '' && address.trim() !== (currentAddress ?? '').trim();

    if (addressChanged) {
      try {
        const coords = await geocodeAddress(address.trim());
        lat = coords.lat;
        lng = coords.lng;
      } catch (geoError) {
        // Return a clear error so the admin knows the address wasn't saved properly
        return {
          statusCode: 422,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            error: `Geocoding failed: ${geoError.message}. Check the address and try again.`,
          }),
        };
      }
    }

    if (addressChanged) {
      // Update all fields including new lat/lng
      await sql`
        UPDATE players
        SET
          name = ${name},
          position = ${position},
          age = ${age},
          nationality = ${nationality},
          jersey_number = ${jerseyNumber},
          height = ${height},
          weight = ${weight},
          goals = ${goals},
          assists = ${assists},
          saves = ${saves},
          appearances = ${appearances},
          photo = ${photo},
          bio = ${bio},
          skill = ${skill},
          address = ${address},
          has_car = ${hasCar ?? false},
          contact = ${contact},
          lat = ${lat},
          lng = ${lng}
        WHERE id = ${id};
      `;
    } else {
      // Update all fields except lat/lng (address unchanged or empty)
      await sql`
        UPDATE players
        SET
          name = ${name},
          position = ${position},
          age = ${age},
          nationality = ${nationality},
          jersey_number = ${jerseyNumber},
          height = ${height},
          weight = ${weight},
          goals = ${goals},
          assists = ${assists},
          saves = ${saves},
          appearances = ${appearances},
          photo = ${photo},
          bio = ${bio},
          skill = ${skill},
          address = ${address},
          has_car = ${hasCar ?? false},
          contact = ${contact}
        WHERE id = ${id};
      `;
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Player updated successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
