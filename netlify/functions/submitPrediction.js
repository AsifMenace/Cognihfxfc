import { neon } from "@netlify/neon";

const sql = neon();

// Halifax-local calendar date (YYYY-MM-DD) for an instant — defines "a day" for
// the user-mode one-banker-per-day rule. Mirrors getWcPerfectDays.js.
const halifaxDay = (iso) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Halifax",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));

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

    // Banker validation depends on the global mode (defaults to 'admin' if the
    // settings row/table is absent, preserving current behaviour).
    if (is_banker) {
      let bankerMode = "admin";
      try {
        const settings = await sql`SELECT banker_mode FROM wc_settings WHERE id = 1`;
        if (settings.length && settings[0].banker_mode) bankerMode = settings[0].banker_mode;
      } catch {
        // wc_settings not present yet — keep the 'admin' default.
      }

      if (bankerMode === "admin") {
        // Admin mode: banker only on the admin-designated match. One-per-day is
        // implied by there being a single banker match per day.
        if (!match.is_banker_match) {
          return {
            statusCode: 409,
            headers: corsHeaders,
            body: JSON.stringify({
              error: "This match isn't the Banker match for the day",
            }),
          };
        }
      } else {
        // User mode: banker any match, but at most one per Halifax-local day.
        // Exclude this match so re-submitting/editing the same pick doesn't clash
        // with its own existing banker row.
        const matchDay = halifaxDay(match.kickoff_time);
        const existingBankers = await sql`
          SELECT m.kickoff_time
          FROM wc_predictions wp
          JOIN wc_matches m ON m.id = wp.match_id
          WHERE wp.player_id = ${player_id}
            AND wp.is_banker = TRUE
            AND wp.match_id <> ${match_id}
        `;
        const clash = existingBankers.some(
          (b) => halifaxDay(b.kickoff_time) === matchDay
        );
        if (clash) {
          return {
            statusCode: 409,
            headers: corsHeaders,
            body: JSON.stringify({
              error: "You've already used your Banker for this day",
            }),
          };
        }
      }
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
