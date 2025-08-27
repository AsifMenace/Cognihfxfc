import { neon } from "@netlify/neon";

export async function handler() {
  const client = new Client();
  await client.connect();

  const standingsQuery = `
    WITH all_team_matches AS (
      SELECT home_team_id AS team_id,
             CAST(split_part(result, '-', 1) AS INTEGER) AS goals_for,
             CAST(split_part(result, '-', 2) AS INTEGER) AS goals_against
      FROM matches
      WHERE home_team_id IS NOT NULL AND away_team_id IS NOT NULL AND result IS NOT NULL

      UNION ALL

      SELECT away_team_id AS team_id,
             CAST(split_part(result, '-', 2) AS INTEGER) AS goals_for,
             CAST(split_part(result, '-', 1) AS INTEGER) AS goals_against
      FROM matches
      WHERE home_team_id IS NOT NULL AND away_team_id IS NOT NULL AND result IS NOT NULL
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
      r.played,
      r.wins,
      r.draws,
      r.losses,
      r.goals_for,
      r.goals_against,
      (r.goals_for - r.goals_against) AS goal_difference,
      (r.wins * 3 + r.draws) AS points
    FROM team_results r
    JOIN teams t ON r.team_id = t.id
    ORDER BY points DESC, goal_difference DESC, goals_for DESC;
  `;

  try {
    const result = await client.query(standingsQuery);
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  } finally {
    await client.end();
  }
}
