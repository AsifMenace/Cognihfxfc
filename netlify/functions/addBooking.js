import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { booking_date, start_time, end_time, session, field_number } =
      JSON.parse(event.body);

    // Basic validation
    if (
      !booking_date ||
      !start_time ||
      !end_time ||
      !session ||
      !field_number ||
      (session !== "morning" && session !== "night") ||
      typeof field_number !== "number"
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid or missing fields" }),
      };
    }

    // Insert booking
    const result = await sql`
      INSERT INTO field_bookings
        (booking_date, start_time, end_time, session, field_number)
      VALUES
        (${booking_date}, ${start_time}, ${end_time}, ${session}, ${field_number})
      RETURNING id
    `;

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Booking added successfully",
        bookingId: result[0].id,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
