import { neon } from '@netlify/neon';
import { scheduleJob, cancelJob, INITIAL_OFFSET_MINUTES } from './autoFetchWcResult.js';

const sql = neon();

// Official game day (US Eastern) calendar date (YYYY-MM-DD) for an instant — defines "a day" for
// the one-banker-match-per-day rule. Mirrors submitPrediction.js.
const gameDay = (iso) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));

// Get flag URL from country code
const getFlagUrl = (code) => {
  if (!code || code.trim() === '') return 'https://flagcdn.com/w80/white.png';
  return `https://flagcdn.com/w80/${code}.png`;
};

// Map country names to flag codes
const getCountryCode = (teamName) => {
  const countryMap = {
    'South Korea': 'kr',
    Czechia: 'cz',
    'Czech Republic': 'cz',
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
    USA: 'us',
    Wales: 'gb-wls',
    Scotland: 'gb-sct',
    Venezuela: 've',
    Bolivia: 'bo',
    Albania: 'al',
    Austria: 'at',
    Azerbaijan: 'az',
    'Bosnia and Herzegovina': 'ba',
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
  return countryMap[teamName] || 'white';
};

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
    const {
      fixture_id,
      home_team,
      away_team,
      home_code,
      away_code,
      home_flag,
      away_flag,
      kickoff_time,
      is_banker_match,
      trivia_question,
      trivia_options,
    } = JSON.parse(event.body);

    const bankerMatch = is_banker_match === true;

    // Optional bonus trivia — only stored when there's a question and ≥2 options.
    let triviaQuestion = null;
    let triviaOptions = null;
    {
      const q = typeof trivia_question === 'string' ? trivia_question.trim() : '';
      const opts = Array.isArray(trivia_options)
        ? trivia_options.map((o) => String(o).trim()).filter((o) => o.length)
        : [];
      if (q && opts.length >= 2) {
        triviaQuestion = q;
        triviaOptions = JSON.stringify(opts);
      }
    }

    if (!fixture_id || !home_team || !away_team || !kickoff_time) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Ensure flags are valid URLs (never null/empty stored in DB)
    // Priority: 1) provided flag URL, 2) country code, 3) team name lookup, 4) white flag
    let storedHomeFlag = home_flag && home_flag.trim() ? home_flag : null;
    let storedAwayFlag = away_flag && away_flag.trim() ? away_flag : null;

    // If no flag URL provided, construct from country code
    if (!storedHomeFlag) {
      const homeCodeForFlag = home_code || getCountryCode(home_team);
      storedHomeFlag = getFlagUrl(homeCodeForFlag);
    }
    if (!storedAwayFlag) {
      const awayCodeForFlag = away_code || getCountryCode(away_team);
      storedAwayFlag = getFlagUrl(awayCodeForFlag);
    }

    // One banker match per game day. If this activation designates the
    // banker, reject when another match (not this one) already holds it that day.
    if (bankerMatch) {
      const day = gameDay(kickoff_time);
      const existing = await sql`
        SELECT home_team, away_team, kickoff_time
        FROM wc_matches
        WHERE is_banker_match = TRUE AND fixture_id <> ${fixture_id}
      `;
      const clash = existing.find((m) => gameDay(m.kickoff_time) === day);
      if (clash) {
        return {
          statusCode: 409,
          headers: corsHeaders,
          body: JSON.stringify({
            error: `Banker already set for this day on ${clash.home_team} vs ${clash.away_team}`,
          }),
        };
      }
    }

    const [saved] = await sql`
      INSERT INTO wc_matches (fixture_id, home_team, away_team, home_code, away_code, home_flag, away_flag, kickoff_time, status, activated_at, is_banker_match, trivia_question, trivia_options)
      VALUES (${fixture_id}, ${home_team}, ${away_team}, ${home_code}, ${away_code}, ${storedHomeFlag}, ${storedAwayFlag}, ${kickoff_time}, 'active', NOW(), ${bankerMatch}, ${triviaQuestion}, ${triviaOptions})
      ON CONFLICT (fixture_id)
      DO UPDATE SET
        status = 'active',
        home_flag = ${storedHomeFlag},
        away_flag = ${storedAwayFlag},
        activated_at = NOW(),
        is_banker_match = ${bankerMatch},
        trivia_question = ${triviaQuestion},
        trivia_options = ${triviaOptions}
      RETURNING id, cronjob_id
    `;

    // Cancel any previously scheduled fetch job for this match (e.g. re-activation)
    if (saved.cronjob_id) {
      await cancelJob(saved.cronjob_id);
      await sql`UPDATE wc_matches SET cronjob_id = NULL WHERE id = ${saved.id}`;
    }

    // Schedule auto-fetch 110 min after kickoff if that time is still in the future
    const fetchAt = new Date(new Date(kickoff_time).getTime() + INITIAL_OFFSET_MINUTES * 60 * 1000);
    let scheduling = null;
    if (fetchAt > new Date()) {
      try {
        const jobId = await scheduleJob(saved.id, fetchAt);
        await sql`UPDATE wc_matches SET cronjob_id = ${String(jobId)} WHERE id = ${saved.id}`;
        scheduling = { ok: true, jobId, fetchAt };
      } catch (e) {
        scheduling = { ok: false, error: e.message };
      }
    } else {
      scheduling = { ok: false, error: 'fetchAt is in the past — kickoff may have already passed' };
    }
    console.log('[activateWcMatch] scheduling result:', JSON.stringify(scheduling));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Match activated successfully', scheduling }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
