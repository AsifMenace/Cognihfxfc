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

    // Insert once - a prediction is final and cannot be changed.
    const inserted = await sql`
      INSERT INTO wc_predictions (match_id, player_id, prediction)
      VALUES (${match_id}, ${player_id}, ${prediction})
      ON CONFLICT (match_id, player_id) DO NOTHING
      RETURNING id
    `;

    if (inserted.length === 0) {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({ error: "You have already predicted this match" }),
      };
    }

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
