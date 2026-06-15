import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { match_id, player_id, prediction } = JSON.parse(event.body);
    const is_banker = JSON.parse(event.body).is_banker === true;

    if (!match_id || !player_id || !prediction) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    if (!["home", "draw", "away"].includes(prediction)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid prediction value" }),
      };
    }

    // Fetch match and verify it's still open
    const matches = await sql`
      SELECT * FROM wc_matches WHERE id = ${match_id}
    `;

    if (matches.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Match not found" }),
      };
    }

    const match = matches[0];

    // Check kickoff time server-side (don't trust client)
    if (new Date(match.kickoff_time) <= new Date()) {
      // Lock the match while we're here
      await sql`UPDATE wc_matches SET status = 'locked' WHERE id = ${match.id}`;
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Predictions are locked - match has kicked off" }),
      };
    }

    if (match.status !== "active") {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: "This match is not open for predictions" }),
      };
    }

    // Banker can only land on the admin-designated banker match for the day.
    // (One banker per day is guaranteed by there being a single banker match
    // per day, so no separate per-day check is needed.)
    if (is_banker && !match.is_banker_match) {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "This match isn't the Banker match for the day",
        }),
      };
    }

    // Upsert — predictions can be changed until the match locks (kickoff guard
    // above). Re-submitting overwrites the pick and the banker flag.
    await sql`
      INSERT INTO wc_predictions (match_id, player_id, prediction, is_banker)
      VALUES (${match_id}, ${player_id}, ${prediction}, ${is_banker})
      ON CONFLICT (match_id, player_id)
      DO UPDATE SET prediction = ${prediction}, is_banker = ${is_banker}
    `;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Prediction saved" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
