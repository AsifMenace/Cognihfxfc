import { neon } from '@netlify/neon';

const sql = neon();

// Normalises team names from both APIs to a common key so mismatches
// like "Czechia" (football-data) vs "Czech Republic" (api-football) still match.
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

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'LIVE']);
const SCORED_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'LIVE', 'FT', 'AET', 'PEN', 'AWD']);

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

    // Use UTC date from kickoff_time to search api-football by date
    const utcDate = new Date(match.kickoff_time).toISOString().split('T')[0];

    const apiKey = process.env.API_FOOTBALL_KEY;
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${utcDate}`,
      { headers: { 'x-apisports-key': apiKey } }
    );

    if (!res.ok) throw new Error(`API error ${res.status}`);

    const data = await res.json();

    // Find WC fixture matching this match by team names
    const homeCanon = toCanonical(match.home_team);
    const awayCanon = toCanonical(match.away_team);

    const fixture = (data.response || []).find(
      (f) =>
        f.league?.id === 1 &&
        toCanonical(f.teams.home.name) === homeCanon &&
        toCanonical(f.teams.away.name) === awayCanon
    );

    if (!fixture) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: `Match not found in api-football for ${match.home_team} vs ${match.away_team} on ${utcDate}. Try the manual score entry.`,
          live_home_goals: null,
          live_away_goals: null,
        }),
      };
    }

    const apiStatus = fixture.fixture.status.short;

    if (!SCORED_STATUSES.has(apiStatus)) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: `No live score yet. Match status: ${apiStatus}`,
          api_status: apiStatus,
          live_home_goals: null,
          live_away_goals: null,
        }),
      };
    }

    const homeGoals = fixture.goals.home ?? 0;
    const awayGoals = fixture.goals.away ?? 0;

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
