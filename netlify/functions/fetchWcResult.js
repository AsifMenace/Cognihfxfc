import { neon } from '@netlify/neon';
import { cancelJob } from './autoFetchWcResult.js';

const sql = neon();

const CANONICAL = {
  'czechia': 'czech',
  'czech republic': 'czech',
  'south korea': 'korea',
  'korea republic': 'korea',
  "côte d'ivoire": 'ivorycoast',
  "cote d'ivoire": 'ivorycoast',
  'ivory coast': 'ivorycoast',
  'bosnia and herzegovina': 'bosnia',
  'bosnia & herzegovina': 'bosnia',
  'united states': 'usa',
  'usa': 'usa',
  'trinidad & tobago': 'trinidadtobago',
  'trinidad and tobago': 'trinidadtobago',
  'north macedonia': 'macedonia',
  'republic of ireland': 'ireland',
  'new zealand': 'newzealand',
  'saudi arabia': 'saudiarabia',
  'south africa': 'southafrica',
};

const toCanonical = (name) => {
  const lower = name.toLowerCase().trim();
  return CANONICAL[lower] || lower.replace(/[^a-z]/g, '');
};

const AF_FINISHED = new Set(['FT', 'AET', 'PEN', 'AWD']);
const FD_FINISHED = new Set(['FINISHED', 'AWARDED']);

// ── api-football.com lookup ───────────────────────────────────────────────────
async function fetchFromApiFootball(match) {
  const kickoff = new Date(match.kickoff_time);
  const utcDate = kickoff.toISOString().split('T')[0];
  const nextDay = new Date(kickoff);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const utcDatePlus1 = nextDay.toISOString().split('T')[0];

  const headers = { 'x-apisports-key': process.env.API_FOOTBALL_KEY };

  const [res1, res2] = await Promise.all([
    fetch(`https://v3.football.api-sports.io/fixtures?date=${utcDate}`, { headers }),
    fetch(`https://v3.football.api-sports.io/fixtures?date=${utcDatePlus1}`, { headers }),
  ]);

  const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

  const apiError = (d) => d.errors && Object.keys(d.errors).length ? Object.values(d.errors)[0] : null;
  const err = apiError(data1) || apiError(data2);
  if (err) throw new Error(err);

  const homeCanon = toCanonical(match.home_team);
  const awayCanon = toCanonical(match.away_team);

  const fixture = [...(data1.response || []), ...(data2.response || [])].find(
    (f) =>
      f.league?.id === 1 &&
      toCanonical(f.teams.home.name) === homeCanon &&
      toCanonical(f.teams.away.name) === awayCanon
  );

  if (!fixture) return null;

  const status = fixture.fixture.status.short;
  if (!AF_FINISHED.has(status)) return { notFinished: true, status };

  const homeGoals = fixture.goals.home;
  const awayGoals = fixture.goals.away;
  if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) {
    return { notFinished: true, status };
  }

  // For PEN matches, determine who won the shootout
  let penaltyWinner = null;
  if (status === 'PEN' && homeGoals === awayGoals) {
    const penHome = fixture.score?.penalty?.home;
    const penAway = fixture.score?.penalty?.away;
    if (penHome != null && penAway != null) {
      penaltyWinner = penHome > penAway ? 'home' : 'away';
    }
  }

  return { homeGoals, awayGoals, penaltyWinner, source: 'api-football' };
}

// ── football-data.org fallback ────────────────────────────────────────────────
async function fetchFromFootballData(match) {
  const res = await fetch(
    `https://api.football-data.org/v4/matches/${match.fixture_id}`,
    { headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY } }
  );

  const data = await res.json();
  const matchData = data.match ?? data;
  const status = matchData.status;

  if (!FD_FINISHED.has(status)) return { notFinished: true, status };

  // football-data.org v4 puts the penalty aggregate into score.fullTime for
  // penalty matches (e.g. 5–4 instead of 1–1), and score.extraTime holds only
  // the goals scored during the ET period (not cumulative).
  // Goals at end of 120 min = regularTime + extraTime.
  // For non-penalty matches, fullTime is the correct end-of-match score.
  const isPenaltyShootout = matchData.score?.duration === 'PENALTY_SHOOTOUT';

  let homeGoals, awayGoals;
  if (isPenaltyShootout) {
    const regHome = matchData.score?.regularTime?.home;
    const regAway = matchData.score?.regularTime?.away;
    if (regHome == null || regAway == null) return { notFinished: true, status };
    homeGoals = regHome + (matchData.score?.extraTime?.home ?? 0);
    awayGoals = regAway + (matchData.score?.extraTime?.away ?? 0);
  } else {
    homeGoals = matchData.score?.fullTime?.home;
    awayGoals = matchData.score?.fullTime?.away;
  }

  if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) {
    return { notFinished: true, status };
  }

  let penaltyWinner = null;
  if (isPenaltyShootout) {
    const w = matchData.score?.winner;
    if (w === 'HOME_TEAM') penaltyWinner = 'home';
    else if (w === 'AWAY_TEAM') penaltyWinner = 'away';
    else {
      // winner field null — fall back to fullTime which contains penalty aggregate
      const ftHome = matchData.score?.fullTime?.home;
      const ftAway = matchData.score?.fullTime?.away;
      if (ftHome != null && ftAway != null && ftHome !== ftAway) {
        penaltyWinner = ftHome > ftAway ? 'home' : 'away';
      }
    }
  }

  return { homeGoals, awayGoals, penaltyWinner, source: 'football-data' };
}

// ── Handler ───────────────────────────────────────────────────────────────────
export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { match_id } = JSON.parse(event.body);
    if (!match_id) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing match_id' }) };
    }

    const matches = await sql`SELECT * FROM wc_matches WHERE id = ${match_id}`;
    if (matches.length === 0) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Match not found' }) };
    }

    const match = matches[0];

    // ── Step 1: try api-football.com ─────────────────────────────────────────
    let scoreData = null;
    let apiUsed = '';

    try {
      scoreData = await fetchFromApiFootball(match);
      apiUsed = 'api-football';
    } catch (e) {
      // Suspended, quota exceeded, or network error — fall through to backup
    }

    // ── Step 2: fallback to football-data.org ────────────────────────────────
    if (!scoreData) {
      try {
        scoreData = await fetchFromFootballData(match);
        apiUsed = 'football-data';
      } catch (e) {
        // Both APIs failed
      }
    }

    // ── Step 3: both failed ───────────────────────────────────────────────────
    if (!scoreData) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Both APIs unavailable right now. Use manual score entry instead.',
        }),
      };
    }

    if (scoreData.notFinished) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: `Match not finished yet. Current status: ${scoreData.status}`,
          status: scoreData.status,
        }),
      };
    }

    const { homeGoals, awayGoals } = scoreData;

    let result;
    if (homeGoals > awayGoals) result = 'home';
    else if (awayGoals > homeGoals) result = 'away';
    else if (match.is_knockout && scoreData.penaltyWinner) result = scoreData.penaltyWinner;
    else result = 'draw';

    await sql`
      UPDATE wc_matches
      SET result = ${result},
          status = 'completed',
          final_home_goals = ${homeGoals},
          final_away_goals = ${awayGoals},
          cronjob_id = NULL
      WHERE id = ${match_id}
    `;

    if (match.is_knockout) {
      // Knockout: winner points (banker doubles) + flat score bonus (no banker effect)
      await sql`
        UPDATE wc_predictions
        SET points = CASE
          WHEN predicted_winner = ${result} THEN (CASE WHEN is_banker THEN 2 ELSE 1 END)
          ELSE (CASE WHEN is_banker THEN -2 ELSE 0 END)
        END
        WHERE match_id = ${match_id}
      `;
      await sql`
        UPDATE wc_predictions
        SET score_points = CASE
          WHEN predicted_home_goals = ${homeGoals} AND predicted_away_goals = ${awayGoals} THEN 5
          ELSE 0
        END
        WHERE match_id = ${match_id}
      `;
    } else {
      await sql`
        UPDATE wc_predictions
        SET points = CASE
          WHEN prediction = ${result} THEN (CASE WHEN is_banker THEN 2 ELSE 1 END)
          ELSE (CASE WHEN is_banker THEN -1 ELSE 0 END)
        END
        WHERE match_id = ${match_id}
      `;
    }

    // Result is in — cancel the pending auto-fetch cron so it doesn't fire again.
    await cancelJob(match.cronjob_id);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: `Result fetched and points awarded (via ${apiUsed})`,
        result,
        home_goals: homeGoals,
        away_goals: awayGoals,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
