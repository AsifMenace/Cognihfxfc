import { neon } from "@netlify/neon";
import { validateAdmin } from "./validateAdmin.js";

const sql = neon();

export const handler = async (event) => {
  if (!validateAdmin(event)) {
    return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

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
