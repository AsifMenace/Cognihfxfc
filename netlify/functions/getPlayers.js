import { neon } from "@netlify/neon";

const sql = neon(); // Automatically uses NETLIFY_DATABASE_URL from your environment

export const handler = async (event) => {
  // Handle preflight OPTIONS requests for CORS
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

  try {
    // Get query parameters for sorting
    const sortBy = event.queryStringParameters?.sortBy || "name";
    const order = event.queryStringParameters?.order || "ASC";

    // Whitelist allowed sort fields
    const allowedSortFields = [
      "name",
      "appearances",
      "goals",
      "assists",
      "position",
      "jersey_number",
      "age",
    ];
    const allowedOrders = ["ASC", "DESC"];

    // Validate inputs
    const validSortBy = allowedSortFields.includes(sortBy.toLowerCase())
      ? sortBy.toLowerCase()
      : "name";
    const validOrder = allowedOrders.includes(order.toUpperCase())
      ? order.toUpperCase()
      : "ASC";

    // Build the query string with validated inputs (safe because we whitelisted them)
    const query = `
      SELECT
        id,
        name,
        position,
        age,
        nationality,
        jersey_number AS "jerseyNumber",
        height,
        weight,
        goals,
        assists,
        saves,
        appearances,
        photo,
        bio
      FROM players
      ORDER BY ${validSortBy} ${validOrder}
    `;

    const players = await sql(query);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(players),
    };
  } catch (error) {
    console.error("Error fetching players:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
