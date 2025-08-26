import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Optionally: Check for admin authentication here!

  try {
    const { id, result } = JSON.parse(event.body);

    if (!id || !result) {
      return { statusCode: 400, body: "Missing id or result" };
    }

    await sql`
      UPDATE matches SET result=${result} WHERE id=${id};
    `;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
