import { neon } from '@netlify/neon';

const sql = neon();

export const handler = async (event) => {
  // Handle CORS so it works in StackBlitz/dev
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

  const limit = event.queryStringParameters?.limit ? Number(event.queryStringParameters.limit) : 5; // Default to 5
  try {
    const topScorers = await sql`
      SELECT
        players.id,
        players.name,
        players.position,
        COUNT(match_goals.player_id) AS goals,
        count(distinct match_players.match_id) as appearances,
        players.photo
      FROM
      players
  join match_players  on match_players.player_id=players.id
  join matches  on matches.id=match_players.match_Id
  left join match_goals  on match_goals.player_id=players.id and matches.id=match_goals.match_id
      WHERE matches.competition ILIKE 'League%'
      GROUP BY players.id, players.name, players.position, players.photo
      ORDER BY goals DESC
      LIMIT ${limit};
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(topScorers),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
