import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  // Handle CORS so it works in StackBlitz/dev
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  const limit = event.queryStringParameters?.limit
    ? Number(event.queryStringParameters.limit)
    : 5; // Default to 5

  try {
    const topScorers = await sql`
      SELECT
        id,
        name,
        position,
        goals,
        appearances,
        photo
      FROM players
      ORDER BY goals DESC, appearances ASC
      LIMIT ${limit};
    `;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(topScorers),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
