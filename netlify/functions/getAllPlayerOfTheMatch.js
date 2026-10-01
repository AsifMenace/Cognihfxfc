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
    // 1️⃣ Manually assigned POTM for every match that has one
    const manual = await sql`
      SELECT potm.match_id, p.id, p.name, p.photo, p.jersey_number, p.position,
             COALESCE(mg.goals, 0) as goals,
             COALESCE(pms.assists, 0) as assists,
             COALESCE(pms.saves, 0) as saves
      FROM playerofthematch potm
      JOIN players p ON potm.player_id = p.id
      LEFT JOIN (
        SELECT match_id, player_id, COUNT(*) as goals
        FROM match_goals
        GROUP BY match_id, player_id
      ) mg ON mg.match_id = potm.match_id AND mg.player_id = p.id
      LEFT JOIN player_match_stats pms
        ON pms.player_id = p.id AND pms.match_id = potm.match_id
    `;

    const potmMap = {};
    for (const row of manual) {
      potmMap[row.match_id] = {
        matchId: row.match_id,
        name: row.name,
        photoUrl: row.photo,
        goals: Number(row.goals),
        assists: Number(row.assists),
        saves: Number(row.saves),
        jerseyNumber: row.jersey_number,
        position: row.position,
      };
    }

    // 2️⃣ Algorithmic fallback (goals→assists→saves) for matches without a manual pick
    const algorithmic = await sql`
      WITH goal_counts AS (
        SELECT match_id, player_id, COUNT(*) AS goals
        FROM match_goals
        GROUP BY match_id, player_id
      ),
      combined AS (
        SELECT
          COALESCE(gc.match_id, pms.match_id) AS match_id,
          COALESCE(gc.player_id, pms.player_id) AS player_id,
          COALESCE(gc.goals, 0) AS goals,
          COALESCE(pms.assists, 0) AS assists,
          COALESCE(pms.saves, 0) AS saves
        FROM goal_counts gc
        FULL OUTER JOIN player_match_stats pms
          ON gc.match_id = pms.match_id AND gc.player_id = pms.player_id
      ),
      scored AS (
        SELECT
          c.match_id, p.id, p.name, p.photo, p.jersey_number, p.position,
          c.goals, c.assists, c.saves,
          ROW_NUMBER() OVER (
            PARTITION BY c.match_id
            ORDER BY (c.goals * 3 + c.assists * 2 + c.saves * 1) DESC, p.jersey_number ASC
          ) AS rn
        FROM combined c
        JOIN players p ON p.id = c.player_id
        WHERE c.goals > 0 OR c.assists > 0 OR c.saves > 0
      )
      SELECT * FROM scored WHERE rn = 1
    `;

    for (const row of algorithmic) {
      if (potmMap[row.match_id]) continue; // manual pick wins
      potmMap[row.match_id] = {
        matchId: row.match_id,
        name: row.name,
        photoUrl: row.photo,
        goals: Number(row.goals),
        assists: Number(row.assists),
        saves: Number(row.saves),
        jerseyNumber: row.jersey_number,
        position: row.position,
      };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(potmMap),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
