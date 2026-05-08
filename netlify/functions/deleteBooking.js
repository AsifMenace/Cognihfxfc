import { neon } from "@netlify/neon";
import { validateAdmin } from "./validateAdmin.js";
const sql = neon();

export const handler = async (event) => {
  if (!validateAdmin(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  if (event.httpMethod !== "DELETE")
    return { statusCode: 405, body: "Method Not Allowed" };

  const { id } = event.queryStringParameters;

  if (!id)
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing booking ID" }),
    };

  try {
    await sql`
      DELETE FROM field_bookings WHERE id = ${id}
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Booking deleted" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
