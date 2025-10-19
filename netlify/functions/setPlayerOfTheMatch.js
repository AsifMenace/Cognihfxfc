import { neon } from "@netlify/neon";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const sql = neon();
  try {
    const { match_id, player_id } = JSON.parse(event.body);

    await sql`
      INSERT INTO playerofthematch (match_id, player_id)
      VALUES (${match_id}, ${player_id})
      ON CONFLICT (match_id) DO UPDATE SET
        player_id = EXCLUDED.player_id
    `;

    return { statusCode: 200, body: "Player of the Match updated" };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
