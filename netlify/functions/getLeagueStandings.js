import { neon } from "@netlify/neon";

const sql = neon();
export const handler = async () => {
  try {
    const result = await sql`WITH league_teams AS (
  SELECT DISTINCT team_id
  FROM (
    SELECT home_team_id AS team_id
    FROM matches
    WHERE home_team_id IS NOT NULL
      AND competition ILIKE 'League%'
    UNION ALL
    SELECT away_team_id AS team_id
    FROM matches
    WHERE away_team_id IS NOT NULL
      AND competition ILIKE 'League%'
  ) sub
),
all_team_matches AS (
  SELECT home_team_id AS team_id,
         COALESCE(CAST(split_part(result, '-', 1) AS INTEGER), 0) AS goals_for,
         COALESCE(CAST(split_part(result, '-', 2) AS INTEGER), 0) AS goals_against
  FROM matches
  WHERE home_team_id IS NOT NULL
    AND away_team_id IS NOT NULL
    AND result IS NOT NULL
    AND competition ILIKE 'League%'
  UNION ALL
  SELECT away_team_id AS team_id,
         COALESCE(CAST(split_part(result, '-', 2) AS INTEGER), 0) AS goals_for,
         COALESCE(CAST(split_part(result, '-', 1) AS INTEGER), 0) AS goals_against
  FROM matches
  WHERE home_team_id IS NOT NULL
    AND away_team_id IS NOT NULL
    AND result IS NOT NULL
    AND competition ILIKE 'League%'
),
team_results AS (
  SELECT
    team_id,
    COUNT(*) AS played,
    SUM(CASE WHEN goals_for > goals_against THEN 1 ELSE 0 END) AS wins,
    SUM(CASE WHEN goals_for = goals_against THEN 1 ELSE 0 END) AS draws,
    SUM(CASE WHEN goals_for < goals_against THEN 1 ELSE 0 END) AS losses,
    SUM(goals_for) AS goals_for,
    SUM(goals_against) AS goals_against
  FROM all_team_matches
  GROUP BY team_id
)
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.color AS team_color,
  COALESCE(r.played, 0) AS played,
  COALESCE(r.wins, 0) AS wins,
  COALESCE(r.draws, 0) AS draws,
  COALESCE(r.losses, 0) AS losses,
  COALESCE(r.goals_for, 0) AS goals_for,
  COALESCE(r.goals_against, 0) AS goals_against,
  COALESCE(r.goals_for, 0) - COALESCE(r.goals_against, 0) AS goal_difference,
  COALESCE(r.wins, 0) * 3 + COALESCE(r.draws, 0) AS points
FROM teams t
JOIN league_teams lt ON t.id = lt.team_id
LEFT JOIN team_results r ON t.id = r.team_id
ORDER BY points DESC, goal_difference DESC, goals_for DESC;
`;

    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  }
};
