import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // Get match ID from query string parameters ?id=123 or from path if preferred
  const matchId = event.queryStringParameters?.id;

  if (!matchId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing match id parameter" }),
    };
  }

  try {
    const matches = await sql`
      SELECT * FROM matches WHERE id = ${matchId} LIMIT 1
    `;

    if (matches.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Match not found" }),
      };
    }

    const match = matches[0];

    // Normalize fields same way as in getMatches.js
    const formattedMatch = {
      ...match,
      isHome: match.ishome,
      date:
        match.date instanceof Date
          ? match.date.toISOString().slice(0, 10)
          : match.date,
      time:
        typeof match.time === "string"
          ? match.time.slice(0, 5)
          : match.time instanceof Date
          ? match.time.toTimeString().slice(0, 5)
          : "TBD",
    };

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ match: formattedMatch }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
