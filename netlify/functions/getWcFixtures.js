// Maps FIFA 3-letter codes to 2-letter ISO codes for flagcdn.com
// Complete mapping for World Cup 2026 participants and other international teams
const FIFA_TO_ISO = {
  // CONCACAF (North America/Central America)
  USA: 'us',
  MEX: 'mx',
  CAN: 'ca',
  CRC: 'cr',
  PAN: 'pa',
  HND: 'hn',
  JAM: 'jm',

  // CONMEBOL (South America)
  ARG: 'ar',
  BRA: 'br',
  URU: 'uy',
  COL: 'co',
  PAR: 'py',
  ECU: 'ec',
  PER: 'pe',
  CHL: 'cl',
  BOL: 'bo',
  VEN: 've',

  // UEFA (Europe)
  ENG: 'gb-eng',
  ESP: 'es',
  FRA: 'fr',
  GER: 'de',
  ITA: 'it',
  NED: 'nl',
  BEL: 'be',
  POR: 'pt',
  POL: 'pl',
  SUI: 'ch',
  AUT: 'at',
  CZE: 'cz',
  SWE: 'se',
  DNK: 'dk',
  NOR: 'no',
  HUN: 'hu',
  ROU: 'ro',
  SVK: 'sk',
  SVN: 'si',
  HRV: 'hr',
  SRB: 'rs',
  BIH: 'ba',
  MNE: 'me',
  ALB: 'al',
  MKD: 'mk',
  GRE: 'gr',
  UKR: 'ua',
  WAL: 'gb-wls',
  SCO: 'gb-sct',
  IRL: 'ie',
  ISL: 'is',
  FIN: 'fi',
  TUR: 'tr',
  KOS: 'xk',
  AZE: 'az',
  GEO: 'ge',
  ISR: 'il',
  KAZ: 'kz',
  RUS: 'ru',
  MDA: 'md',
  MLT: 'mt',
  LUX: 'lu',
  SMR: 'sm',

  // CAF (Africa)
  EGY: 'eg',
  SEN: 'sn',
  CMR: 'cm',
  MAR: 'ma',
  GHA: 'gh',
  NGA: 'ng',
  CIV: 'ci',
  TUN: 'tn',
  RSA: 'za',
  ANG: 'ao',
  BWA: 'bw',
  BEN: 'bj',
  BFA: 'bf',
  BDI: 'bi',
  GAB: 'ga',
  GMB: 'gm',
  GIN: 'gn',
  KEN: 'ke',
  LBR: 'lr',
  MLI: 'ml',
  MOZ: 'mz',
  RWA: 'rw',
  SWZ: 'sz',
  TZA: 'tz',
  UGA: 'ug',
  ZAM: 'zm',
  ZWE: 'zw',

  // AFC (Asia)
  JPN: 'jp',
  KOR: 'kr',
  AUS: 'au',
  IRN: 'ir',
  SAU: 'sa',
  KSA: 'sa',
  ARE: 'ae',
  CHN: 'cn',
  IND: 'in',
  THA: 'th',
  VIE: 'vn',
  INO: 'id',
  MYS: 'my',
  SGP: 'sg',
  PHI: 'ph',
  QAT: 'qa',
  IRQ: 'iq',
  OMA: 'om',
  JOR: 'jo',
  LBN: 'lb',
  PAK: 'pk',
  BAN: 'bd',
  UZB: 'uz',
  TJK: 'tj',
  KGZ: 'kg',

  // OFC (Oceania)
  NZL: 'nz',
  FJI: 'fj',
  SOL: 'sb',
  VUT: 'vu',

  // Historical mappings
  DEN: 'dk',
  CRO: 'hr',
  SSD: 'ss',
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
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) throw new Error('FOOTBALL_DATA_API_KEY not set');

    const dateParam = event.queryStringParameters?.date;
    const date = dateParam || new Date().toISOString().split('T')[0];

    // Halifax is UTC-4 (ADT) in summer. Convert each match UTC time to Halifax
    // local date and keep only matches whose local date matches the requested date.
    const datePlusOne = new Date(date + 'T00:00:00Z');
    datePlusOne.setUTCDate(datePlusOne.getUTCDate() + 1);
    const dateTo = datePlusOne.toISOString().split('T')[0];

    const res = await fetch(
      `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${date}&dateTo=${dateTo}`,
      { headers: { 'X-Auth-Token': apiKey } }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`football-data.org error ${res.status}: ${text}`);
    }

    const data = await res.json();

    const HALIFAX_OFFSET_MS = -4 * 60 * 60 * 1000;

    const matches = (data.matches || [])
      .filter((m) => {
        const localDate = new Date(new Date(m.utcDate).getTime() + HALIFAX_OFFSET_MS);
        const localDateStr = localDate.toISOString().split('T')[0];
        return localDateStr === date;
      })
      .map((m) => {
        const homeTeamTla = m.homeTeam?.tla || '';
        const awayTeamTla = m.awayTeam?.tla || '';

        let homeCode = FIFA_TO_ISO[homeTeamTla];
        let awayCode = FIFA_TO_ISO[awayTeamTla];

        if (!homeCode && homeTeamTla) homeCode = homeTeamTla.toLowerCase();
        if (!awayCode && awayTeamTla) awayCode = awayTeamTla.toLowerCase();
        if (!homeCode) homeCode = 'white';
        if (!awayCode) awayCode = 'white';

        let homeFlag = m.homeTeam?.flag;
        if (!homeFlag) homeFlag = `https://flagcdn.com/w80/${homeCode}.png`;

        let awayFlag = m.awayTeam?.flag;
        if (!awayFlag) awayFlag = `https://flagcdn.com/w80/${awayCode}.png`;

        return {
          fixture_id: m.id,
          home_team: m.homeTeam?.name ?? 'TBD',
          away_team: m.awayTeam?.name ?? 'TBD',
          home_code: homeCode,
          away_code: awayCode,
          kickoff_time: m.utcDate,
          status: m.status,
          home_flag: homeFlag,
          away_flag: awayFlag,
        };
      });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(matches),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
