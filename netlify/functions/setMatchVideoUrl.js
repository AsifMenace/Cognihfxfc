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
    const { id, video_url } = JSON.parse(event.body);

    if (!id || !video_url) {
      return { statusCode: 400, body: "Missing id or video_url" };
    }

    await sql`
      UPDATE matches SET video_url=${video_url} WHERE id=${id};
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
