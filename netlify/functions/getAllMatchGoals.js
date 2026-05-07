import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const goals = await sql`
      SELECT mg.id, mg.match_id, mg.player_id,
             p.name AS player_name,
             t.name AS team_name,
             t.id   AS team_id
      FROM match_goals mg
      JOIN players p ON mg.player_id = p.id
      JOIN teams   t ON mg.team_id   = t.id
      ORDER BY mg.match_id, mg.id
    `;

    const goalsMap = {};
    for (const goal of goals) {
      const mid = goal.match_id;
      if (!goalsMap[mid]) goalsMap[mid] = [];
      goalsMap[mid].push(goal);
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(goalsMap),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
