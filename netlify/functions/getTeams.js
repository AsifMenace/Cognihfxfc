import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async () => {
  try {
    const teams = await sql`
      SELECT id, name, color
      FROM teams
      ORDER BY name ASC
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(teams),
    };
  } catch (error) {
    console.error("Error fetching teams:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch teams" }),
    };
  }
};
