import { neon } from "@netlify/neon";

export async function handler(event) {
  const sql = neon();

  try {
    // 1️⃣ Check if match_id was provided as query parameter
    const matchIdParam = event.queryStringParameters?.match_id;
    let matchId = matchIdParam ? Number(matchIdParam) : null;

    if (!matchId) {
      // Default behavior — find latest match with result
      const [{ max }] = await sql`
        SELECT MAX(id) FROM matches WHERE result IS NOT NULL
      `;
      matchId = max;
    }

    if (!matchId) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "No matches found" }),
      };
    }

    // 2️⃣ Look for manual Player of the Match first
    const assigned = await sql`
      SELECT player_id
      FROM playerofthematch
      WHERE match_id = ${matchId}
    `;

    let playerId;
    let goals = 0;

    if (assigned.length > 0) {
      playerId = assigned[0].player_id;

      // Count player’s goals in that match
      const [{ count }] =
        await sql`SELECT COUNT(*) FROM match_goals WHERE match_id = ${matchId} AND player_id = ${playerId}`;
      goals = Number(count);
    } else {
      // Fallback → highest goalscorer
      const topScorer = await sql`
        SELECT player_id, COUNT(*) AS goals
        FROM match_goals
        WHERE match_id = ${matchId}
        GROUP BY player_id
        ORDER BY goals DESC
        LIMIT 1
      `;

      if (topScorer.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "No scorer data found" }),
        };
      }

      playerId = topScorer[0].player_id;
      goals = Number(topScorer[0].goals);
    }

    // 3️⃣ Fetch player details
    const [player] = await sql`
      SELECT id, name, photo
      FROM players
      WHERE id = ${playerId}
      LIMIT 1
    `;

    if (!player) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Player not found" }),
      };
    }

    // 4️⃣ Return JSON response
    return {
      statusCode: 200,
      body: JSON.stringify({
        matchId,
        name: player.name,
        photoUrl: player.photo,
        goals,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
