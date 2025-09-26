import { neon } from "@netlify/neon";
const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const bookingId = event.queryStringParameters?.bookingId;

  if (!bookingId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing bookingId query parameter" }),
    };
  }

  try {
    // Fetch IN voters
    const inPlayers = await sql`
      SELECT p.id, p.name, p.photo
      FROM poll_votes pv
      JOIN players p ON pv.player_id = p.id
      WHERE pv.booking_id = ${bookingId} AND pv.vote = 'in'
    `;

    // Fetch OUT voters
    const outPlayers = await sql`
      SELECT p.id, p.name, p.photo
      FROM poll_votes pv
      JOIN players p ON pv.player_id = p.id
      WHERE pv.booking_id = ${bookingId} AND pv.vote = 'out'
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({
        inPlayers,
        outPlayers,
        inCount: inPlayers.length,
        outCount: outPlayers.length,
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message || "Internal Server Error" }),
    };
  }
};
