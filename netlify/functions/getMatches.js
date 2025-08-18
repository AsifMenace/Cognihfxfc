import { neon } from "@netlify/neon";

// Connect to your Neon DB
const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const matches =
      await sql`SELECT * FROM matches ORDER BY date ASC, time ASC;`;
    const cleanMatches = matches.map((match) => ({
      ...match,
      // Handles boolean true, string 't', boolean false, string 'f'
      isHome: match.isHome === true || match.isHome === "t", // properly boolean
    }));
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(cleanMatches),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
