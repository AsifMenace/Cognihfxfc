import { neon } from "@netlify/neon";

export async function handler(event) {
  const sql = neon();

  try {
    // 1️⃣ Same match ID logic
    const matchIdParam = event.queryStringParameters?.match_id;
    let matchId = matchIdParam ? Number(matchIdParam) : null;

    if (!matchId) {
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

    // 2️⃣ Manual POTM first (ENHANCED - gets full stats)
    const assigned = await sql`
      SELECT p.id, p.name, p.photo, p.jersey_Number,p.position,
             COALESCE(mg.count, 0) as goals,
             COALESCE(pms.assists, 0) as assists,
             COALESCE(pms.saves, 0) as saves
      FROM playerofthematch potm
      JOIN players p ON potm.player_id = p.id
      LEFT JOIN (
        SELECT player_id, COUNT(*) as count
        FROM match_goals
        WHERE match_id = ${matchId}
        GROUP BY player_id
      ) mg ON mg.player_id = p.id
      LEFT JOIN player_match_stats pms ON pms.player_id = p.id AND pms.match_id = ${matchId}
      WHERE potm.match_id = ${matchId}
      LIMIT 1
    `;

    let potm;
    if (assigned.length > 0) {
      potm = assigned[0];
    } else {
      // 3️⃣ Algorithmic: Goals → Assists → Saves (NEW!)
      const topPlayer = await sql`
  SELECT
    p.id, p.name, p.photo, p.jersey_Number, p.position,
    COALESCE(mg.goals, 0) as goals,
    COALESCE(pms.assists, 0) as assists,
    COALESCE(pms.saves, 0) as saves,
    (COALESCE(mg.goals, 0) * 3 +
     COALESCE(pms.assists, 0) * 2 +
     COALESCE(pms.saves, 0) * 1) as score
  FROM players p
  LEFT JOIN (
    SELECT player_id, COUNT(*) as goals
    FROM match_goals
    WHERE match_id = ${matchId}
    GROUP BY player_id
  ) mg ON mg.player_id = p.id
  LEFT JOIN player_match_stats pms ON pms.player_id = p.id AND pms.match_id = ${matchId}
  WHERE mg.goals > 0 OR pms.assists > 0 OR pms.saves > 0
  GROUP BY p.id, p.name, p.photo, p.jersey_Number, p.position, mg.goals, pms.assists, pms.saves
  ORDER BY score DESC, p.jersey_Number ASC
  LIMIT 1
`;

      if (topPlayer.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "No player stats found" }),
        };
      }

      potm = topPlayer[0];
    }

    // 4️⃣ Same response structure (just richer data)
    return {
      statusCode: 200,
      body: JSON.stringify({
        matchId,
        name: potm.name,
        photoUrl: potm.photo,
        goals: Number(potm.goals),
        assists: Number(potm.assists),
        saves: Number(potm.saves),
        jerseyNumber: potm.jerseyNumber,
        position: potm.position,
        score: Number(potm.score),
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
