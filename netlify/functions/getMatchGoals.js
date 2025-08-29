import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  const { matchId } = event.queryStringParameters || {};

  if (!matchId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "matchId query parameter is required" }),
    };
  }

  try {
    const goals = await sql`
      SELECT mg.id as id,mg.player_id as player_id,p.name AS player_name, t.name AS team_name,t.id as team_id
      FROM match_goals mg
      JOIN players p ON mg.player_id = p.id
      JOIN teams t ON mg.team_id = t.id
      WHERE mg.match_id = ${matchId};
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(goals),
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  }
};
