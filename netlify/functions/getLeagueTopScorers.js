import { neon } from '@netlify/neon';

const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const month = event.queryStringParameters?.month || currentMonth;
  const limit = event.queryStringParameters?.limit ? Number(event.queryStringParameters.limit) : 5;

  try {
    const topScorers = await sql`
      SELECT
        players.id,
        players.name,
        players.position,
        COUNT(match_goals.player_id) AS goals,
        players.photo
      FROM players
      JOIN match_goals ON match_goals.player_id = players.id
        JOIN matches ON  matches.id = match_goals.match_id
      WHERE matches.home_team_id IS NOT NULL
        AND matches.away_team_id IS NOT NULL
        AND TO_CHAR(matches.date::date, 'YYYY-MM') = ${month}
      GROUP BY players.id, players.name, players.position, players.photo
      ORDER BY goals DESC
      LIMIT ${limit}
    `;

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(topScorers),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
