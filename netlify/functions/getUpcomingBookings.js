import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async () => {
  try {
    const now = new Date();
    const bookings = await sql`
  SELECT id, booking_date, start_time, end_time, session, field_number
FROM field_bookings
WHERE (booking_date + start_time) >= (now() AT TIME ZONE 'America/Halifax')
ORDER BY booking_date ASC, start_time ASC
LIMIT 25;

`;

    return {
      statusCode: 200,
      body: JSON.stringify(bookings),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
