// Shared helper (not an endpoint): recomputes matches.result from match_goals.
// Home side = home_team_id (internal) or Cogni HFX FC (external matches);
// away side = away_team_id or the opponent team, matching the scoreboard in MatchCentre.
export async function recomputeMatchResult(sql, matchId) {
  const [match] = await sql`
    SELECT m.home_team_id, m.away_team_id,
           t3.id AS opponent_team_id,
           t4.id AS cogni_team_id
    FROM matches m
    LEFT JOIN teams t3 ON m.opponent = t3.name
    LEFT JOIN teams t4 ON t4.name = 'Cogni HFX FC'
    WHERE m.id = ${matchId}
    LIMIT 1
  `;
  if (!match) return null;

  const counts = await sql`
    SELECT team_id, COUNT(*)::int AS goals
    FROM match_goals
    WHERE match_id = ${matchId}
    GROUP BY team_id
  `;
  const goalsFor = (teamId) =>
    teamId ? (counts.find((c) => c.team_id === teamId)?.goals ?? 0) : 0;

  const homeGoals = match.home_team_id
    ? goalsFor(match.home_team_id)
    : goalsFor(match.cogni_team_id);
  const awayGoals = match.away_team_id
    ? goalsFor(match.away_team_id)
    : goalsFor(match.opponent_team_id);

  const result = `${homeGoals}-${awayGoals}`;
  await sql`UPDATE matches SET result = ${result} WHERE id = ${matchId};`;
  return result;
}
