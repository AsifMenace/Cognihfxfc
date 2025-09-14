import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async () => {
  try {
    const results = await sql`
      WITH pairs AS (
        SELECT
          LEAST(home_team_id, away_team_id) AS team1_id,
          GREATEST(home_team_id, away_team_id) AS team2_id,
          COUNT(*) AS total_matches,
          SUM(
            CASE
              WHEN
                LEAST(home_team_id, away_team_id) = home_team_id AND
                (CAST(split_part(result, '-', 1) AS INTEGER) > CAST(split_part(result, '-', 2) AS INTEGER))
              THEN 1
              WHEN
                LEAST(home_team_id, away_team_id) = away_team_id AND
                (CAST(split_part(result, '-', 2) AS INTEGER) > CAST(split_part(result, '-', 1) AS INTEGER))
              THEN 1
              ELSE 0
            END
          ) AS team1_wins,
          SUM(
            CASE
              WHEN
                LEAST(home_team_id, away_team_id) = home_team_id AND
                (CAST(split_part(result, '-', 1) AS INTEGER) < CAST(split_part(result, '-', 2) AS INTEGER))
              THEN 1
              WHEN
                LEAST(home_team_id, away_team_id) = away_team_id AND
                (CAST(split_part(result, '-', 2) AS INTEGER) < CAST(split_part(result, '-', 1) AS INTEGER))
              THEN 1
              ELSE 0
            END
          ) AS team2_wins,
          SUM(
            CASE
              WHEN CAST(split_part(result, '-', 1) AS INTEGER) = CAST(split_part(result, '-', 2) AS INTEGER)
              THEN 1
              ELSE 0
            END
          ) AS draws
        FROM matches
        WHERE result IS NOT NULL and competition ILIKE 'League%'
        GROUP BY team1_id, team2_id
      )
      SELECT
        t1.name AS team1,
        t2.name AS team2,
        total_matches,
        team1_wins,
        team2_wins,
        draws
      FROM pairs
      JOIN teams t1 ON t1.id = pairs.team1_id
      JOIN teams t2 ON t2.id = pairs.team2_id
      ORDER BY total_matches DESC;
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
