import { neon } from '@netlify/neon';

const sql = neon();

// Map country codes to flag CDN URLs
const getCountryCode = (name) => {
  const countryMap = {
    'South Korea': 'kr',
    Czechia: 'cz',
    Mexico: 'mx',
    'South Africa': 'za',
    Argentina: 'ar',
    Australia: 'au',
    Belgium: 'be',
    Brazil: 'br',
    Cameroon: 'cm',
    Canada: 'ca',
    Chile: 'cl',
    China: 'cn',
    Colombia: 'co',
    'Costa Rica': 'cr',
    "Côte d'Ivoire": 'ci',
    Croatia: 'hr',
    Denmark: 'dk',
    Ecuador: 'ec',
    Egypt: 'eg',
    England: 'gb-eng',
    France: 'fr',
    Germany: 'de',
    Ghana: 'gh',
    Greece: 'gr',
    Guatemala: 'gt',
    Haiti: 'ht',
    Honduras: 'hn',
    Iran: 'ir',
    Japan: 'jp',
    'Saudi Arabia': 'sa',
    Morocco: 'ma',
    Netherlands: 'nl',
    Nigeria: 'ng',
    'New Zealand': 'nz',
    Norway: 'no',
    Panama: 'pa',
    Paraguay: 'py',
    Peru: 'pe',
    Poland: 'pl',
    Portugal: 'pt',
    Qatar: 'qa',
    Romania: 'ro',
    Senegal: 'sn',
    Serbia: 'rs',
    Slovakia: 'sk',
    Spain: 'es',
    Switzerland: 'ch',
    Tunisia: 'tn',
    Turkey: 'tr',
    'United Arab Emirates': 'ae',
    Uruguay: 'uy',
    'United States': 'us',
    Wales: 'gb-wls',
    Scotland: 'gb-sct',
    Venezuela: 've',
    Bolivia: 'bo',
    Albania: 'al',
    Austria: 'at',
    Azerbaijan: 'az',
    'Bosnia and Herzegovina': 'ba',
    'Czech Republic': 'cz',
    Finland: 'fi',
    Georgia: 'ge',
    Hungary: 'hu',
    Iceland: 'is',
    Ireland: 'ie',
    Israel: 'il',
    Italy: 'it',
    Kazakhstan: 'kz',
    Kosovo: 'xk',
    Luxembourg: 'lu',
    Montenegro: 'me',
    'North Macedonia': 'mk',
    Malta: 'mt',
    Moldova: 'md',
    Russia: 'ru',
    'San Marino': 'sm',
    Slovenia: 'si',
    Sweden: 'se',
    Ukraine: 'ua',
  };
  return countryMap[name] || 'white';
};

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    // Global banker mode — defaults to 'admin' if the settings row/table is absent
    // (e.g. code deployed before the migration runs), preserving current behaviour.
    let bankerMode = 'admin';
    try {
      const settings = await sql`SELECT banker_mode FROM wc_settings WHERE id = 1`;
      if (settings.length && settings[0].banker_mode) bankerMode = settings[0].banker_mode;
    } catch {
      // wc_settings not present yet — keep the 'admin' default.
    }

    const matches = await sql`
      SELECT * FROM wc_matches
      WHERE status IN ('active', 'locked', 'completed')
      ORDER BY kickoff_time ASC
    `;

    if (matches.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ matches: [], banker_mode: bankerMode }),
      };
    }

    // Auto-lock any active matches past kickoff
    const now = new Date();
    for (const match of matches) {
      if (match.status === 'active' && new Date(match.kickoff_time) <= now) {
        await sql`UPDATE wc_matches SET status = 'locked' WHERE id = ${match.id}`;
        match.status = 'locked';
      }
    }

    // Fetch all predictions for all matches in one query
    const matchIds = matches.map((m) => m.id);
    const predictions = await sql`
      SELECT
        wp.match_id,
        wp.player_id,
        wp.prediction,
        wp.points,
        wp.is_banker,
        p.name AS player_name,
        p.photo AS player_photo
      FROM wc_predictions wp
      JOIN players p ON p.id = wp.player_id
      WHERE wp.match_id = ANY(${matchIds})
      ORDER BY p.name ASC
    `;

    // Group predictions by match_id
    const predByMatch = {};
    for (const pred of predictions) {
      if (!predByMatch[pred.match_id]) predByMatch[pred.match_id] = [];
      predByMatch[pred.match_id].push(pred);
    }

    // Reconstruct flag URLs if they're null in the database
    const result = matches.map((match) => {
      let homeFlag = match.home_flag;
      let awayFlag = match.away_flag;

      // If flags are null, reconstruct them. Prefer the stored ISO code (always
      // flagcdn-valid, set by getWcFixtures) and only fall back to the country-name
      // lookup for legacy rows that have no code.
      if (!homeFlag) {
        const homeCode = match.home_code || getCountryCode(match.home_team);
        homeFlag = `https://flagcdn.com/w80/${homeCode}.png`;
      }
      if (!awayFlag) {
        const awayCode = match.away_code || getCountryCode(match.away_team);
        awayFlag = `https://flagcdn.com/w80/${awayCode}.png`;
      }

      return {
        ...match,
        home_flag: homeFlag,
        away_flag: awayFlag,
        predictions: predByMatch[match.id] ?? [],
      };
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ matches: result, banker_mode: bankerMode }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
