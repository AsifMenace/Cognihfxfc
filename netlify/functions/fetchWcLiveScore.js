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

const AF_SCORED_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'LIVE', 'FT', 'AET', 'PEN', 'AWD']);
const FD_SCORED_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT', 'FINISHED', 'AWARDED']);

// ── api-football.com ──────────────────────────────────────────────────────────
async function fetchLiveFromApiFootball(match) {
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

  if (!res1.ok || !res2.ok) throw new Error(`API error ${res1.status} / ${res2.status}`);

  const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

  const apiError = (d) => d.errors && Object.keys(d.errors).length ? Object.values(d.errors)[0] : null;
  const err = apiError(data1) || apiError(data2);
  if (err) throw new Error(`api-football: ${err}`);

  const homeCanon = toCanonical(match.home_team);
  const awayCanon = toCanonical(match.away_team);

  const fixture = [...(data1.response || []), ...(data2.response || [])].find(
    (f) =>
      f.league?.id === 1 &&
      toCanonical(f.teams.home.name) === homeCanon &&
      toCanonical(f.teams.away.name) === awayCanon
  );

  if (!fixture) return null;

  const apiStatus = fixture.fixture.status.short;
  if (!AF_SCORED_STATUSES.has(apiStatus)) return { noScore: true, status: apiStatus };

  return {
    homeGoals: fixture.goals.home ?? 0,
    awayGoals: fixture.goals.away ?? 0,
    apiStatus,
    source: 'api-football',
  };
}

// ── football-data.org fallback ────────────────────────────────────────────────
async function fetchLiveFromFootballData(match) {
  const res = await fetch(
    `https://api.football-data.org/v4/matches/${match.fixture_id}`,
    { headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY } }
  );

  if (!res.ok) throw new Error(`football-data error ${res.status}`);

  const data = await res.json();
  const matchData = data.match ?? data;
  const status = matchData.status;

  if (!FD_SCORED_STATUSES.has(status)) return { noScore: true, status };

  const homeGoals = matchData.score?.fullTime?.home ?? 0;
  const awayGoals = matchData.score?.fullTime?.away ?? 0;

  return { homeGoals, awayGoals, apiStatus: status, source: 'football-data' };
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
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { match_id } = JSON.parse(event.body);

    if (!match_id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing match_id' }),
      };
    }

    const matches = await sql`SELECT * FROM wc_matches WHERE id = ${match_id}`;
    if (matches.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Match not found' }),
      };
    }

    const match = matches[0];

    if (match.status === 'completed') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Match is already completed. Use Fetch Result instead.' }),
      };
    }

    // ── Step 1: try api-football.com ─────────────────────────────────────────
    let scoreData = null;

    try {
      scoreData = await fetchLiveFromApiFootball(match);
    } catch (e) {
      // Suspended, quota exceeded, or network error — fall through to backup
    }

    // ── Step 2: fallback to football-data.org ────────────────────────────────
    if (!scoreData) {
      try {
        scoreData = await fetchLiveFromFootballData(match);
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
          message: `Match not found or both APIs unavailable for ${match.home_team} vs ${match.away_team}. Try manual score entry.`,
          live_home_goals: null,
          live_away_goals: null,
        }),
      };
    }

    if (scoreData.noScore) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: `No live score yet. Match status: ${scoreData.status}`,
          api_status: scoreData.status,
          live_home_goals: null,
          live_away_goals: null,
        }),
      };
    }

    const { homeGoals, awayGoals, apiStatus } = scoreData;

    await sql`
      UPDATE wc_matches
      SET live_home_goals = ${homeGoals},
          live_away_goals = ${awayGoals},
          live_fetched_at = NOW()
      WHERE id = ${match_id}
    `;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: `Live score updated: ${homeGoals} - ${awayGoals} (${apiStatus})`,
        api_status: apiStatus,
        live_home_goals: homeGoals,
        live_away_goals: awayGoals,
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
