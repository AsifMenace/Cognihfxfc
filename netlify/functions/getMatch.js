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
      SELECT m.*,
       t1.name AS home_team_name, t1.color AS home_team_color,
       t2.name AS away_team_name, t2.color AS away_team_color,
       t3.id AS opponent_id,
       t3.name AS opponent_name, t3.color AS opponent_color,
        t4.id AS cogni_id, t4.name AS cogni_name, t4.color AS cogni_color
FROM matches m
LEFT JOIN teams t1 ON m.home_team_id = t1.id
LEFT JOIN teams t2 ON m.away_team_id = t2.id
LEFT JOIN teams t3 ON m.opponent = t3.name
Left join teamS t4 on t4.name='Cogni HFX FC' and m.opponent = t3.name
WHERE m.id = ${matchId} LIMIT 1
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
