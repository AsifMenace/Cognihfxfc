import { neon } from '@netlify/neon';

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

  return { homeGoals, awayGoals, source: 'api-football' };
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

  const homeGoals = matchData.score?.fullTime?.home;
  const awayGoals = matchData.score?.fullTime?.away;
  if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) {
    return { notFinished: true, status };
  }

  return { homeGoals, awayGoals, source: 'football-data' };
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
    else result = 'draw';

    await sql`
      UPDATE wc_matches
      SET result = ${result},
          status = 'completed',
          final_home_goals = ${homeGoals},
          final_away_goals = ${awayGoals}
      WHERE id = ${match_id}
    `;

    await sql`
      UPDATE wc_predictions
      SET points = CASE WHEN prediction = ${result} THEN 1 ELSE 0 END
      WHERE match_id = ${match_id}
    `;

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
