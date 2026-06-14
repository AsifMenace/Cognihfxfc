// Maps 3-letter team codes (FIFA and IOC variants, since the upstream API's
// `tla` is inconsistent) to 2-letter ISO codes for flagcdn.com.
// Exhaustive across all FIFA member associations so no team falls through to a
// guessed, broken flagcdn URL. Every ISO value here is verified to resolve on
// flagcdn (https://flagcdn.com/w80/<iso>.png). Keep additions verified.
const FIFA_TO_ISO = {
  // ─── CONCACAF (North/Central America & Caribbean) ──────────────────────────
  USA: 'us',
  MEX: 'mx',
  CAN: 'ca',
  CRC: 'cr',
  PAN: 'pa',
  HON: 'hn',
  HND: 'hn',
  JAM: 'jm',
  HAI: 'ht',
  TRI: 'tt',
  SLV: 'sv',
  GUA: 'gt',
  NCA: 'ni',
  BLZ: 'bz',
  CUB: 'cu',
  DOM: 'do',
  CUW: 'cw',
  GLP: 'gp',
  MTQ: 'mq',
  ARU: 'aw',
  SUR: 'sr',
  GUY: 'gy',
  ATG: 'ag',
  DMA: 'dm',
  GRN: 'gd',
  SKN: 'kn',
  LCA: 'lc',
  VIN: 'vc',
  BRB: 'bb',
  BAH: 'bs',
  BER: 'bm',
  CAY: 'ky',
  TCA: 'tc',
  VGB: 'vg',
  VIR: 'vi',
  AIA: 'ai',
  MSR: 'ms',
  PUR: 'pr',

  // ─── CONMEBOL (South America) ──────────────────────────────────────────────
  ARG: 'ar',
  BRA: 'br',
  URU: 'uy',
  COL: 'co',
  PAR: 'py',
  ECU: 'ec',
  PER: 'pe',
  CHI: 'cl',
  CHL: 'cl',
  BOL: 'bo',
  VEN: 've',

  // ─── UEFA (Europe) ─────────────────────────────────────────────────────────
  ENG: 'gb-eng',
  SCO: 'gb-sct',
  WAL: 'gb-wls',
  NIR: 'gb-nir',
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
  DEN: 'dk',
  DNK: 'dk',
  NOR: 'no',
  HUN: 'hu',
  ROU: 'ro',
  SVK: 'sk',
  SVN: 'si',
  CRO: 'hr',
  HRV: 'hr',
  SRB: 'rs',
  BIH: 'ba',
  MNE: 'me',
  ALB: 'al',
  MKD: 'mk',
  GRE: 'gr',
  UKR: 'ua',
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
  LIE: 'li',
  AND: 'ad',
  BLR: 'by',
  BUL: 'bg',
  CYP: 'cy',
  EST: 'ee',
  LVA: 'lv',
  LTU: 'lt',
  GIB: 'gi',
  FRO: 'fo',
  ARM: 'am',

  // ─── CAF (Africa) ──────────────────────────────────────────────────────────
  EGY: 'eg',
  SEN: 'sn',
  CMR: 'cm',
  MAR: 'ma',
  GHA: 'gh',
  NGA: 'ng',
  NGR: 'ng',
  CIV: 'ci',
  TUN: 'tn',
  RSA: 'za',
  ALG: 'dz',
  DZA: 'dz',
  ANG: 'ao',
  BFA: 'bf',
  MLI: 'ml',
  COD: 'cd',
  CGO: 'cg',
  CON: 'cg',
  GAB: 'ga',
  GUI: 'gn',
  GIN: 'gn',
  GNB: 'gw',
  CPV: 'cv',
  ZAM: 'zm',
  ZIM: 'zw',
  ZWE: 'zw',
  UGA: 'ug',
  KEN: 'ke',
  TAN: 'tz',
  TZA: 'tz',
  ETH: 'et',
  SUD: 'sd',
  SDN: 'sd',
  LBY: 'ly',
  MTN: 'mr',
  MRT: 'mr',
  NIG: 'ne',
  TOG: 'tg',
  BEN: 'bj',
  SLE: 'sl',
  LBR: 'lr',
  GAM: 'gm',
  GMB: 'gm',
  EQG: 'gq',
  CTA: 'cf',
  CHA: 'td',
  TCD: 'td',
  MAD: 'mg',
  MDG: 'mg',
  MAW: 'mw',
  MWI: 'mw',
  MOZ: 'mz',
  BOT: 'bw',
  BWA: 'bw',
  NAM: 'na',
  LES: 'ls',
  LSO: 'ls',
  SWZ: 'sz',
  COM: 'km',
  SEY: 'sc',
  MRI: 'mu',
  DJI: 'dj',
  SOM: 'so',
  SSD: 'ss',
  BDI: 'bi',
  RWA: 'rw',
  STP: 'st',
  ERI: 'er',

  // ─── AFC (Asia) ────────────────────────────────────────────────────────────
  JPN: 'jp',
  KOR: 'kr',
  PRK: 'kp',
  AUS: 'au',
  IRN: 'ir',
  SAU: 'sa',
  KSA: 'sa',
  ARE: 'ae',
  UAE: 'ae',
  QAT: 'qa',
  IRQ: 'iq',
  UZB: 'uz',
  JOR: 'jo',
  BHR: 'bh',
  KUW: 'kw',
  OMA: 'om',
  OMN: 'om',
  SYR: 'sy',
  LBN: 'lb',
  PLE: 'ps',
  PAL: 'ps',
  YEM: 'ye',
  IND: 'in',
  CHN: 'cn',
  THA: 'th',
  VIE: 'vn',
  IDN: 'id',
  INA: 'id',
  INO: 'id',
  MAS: 'my',
  MYS: 'my',
  SIN: 'sg',
  SGP: 'sg',
  PHI: 'ph',
  PHL: 'ph',
  HKG: 'hk',
  TPE: 'tw',
  TKM: 'tm',
  TJK: 'tj',
  KGZ: 'kg',
  AFG: 'af',
  NEP: 'np',
  BAN: 'bd',
  SRI: 'lk',
  PAK: 'pk',
  MDV: 'mv',
  BHU: 'bt',
  BRU: 'bn',
  CAM: 'kh',
  LAO: 'la',
  MYA: 'mm',
  MGL: 'mn',
  GUM: 'gu',
  MAC: 'mo',
  TLS: 'tl',

  // ─── OFC (Oceania) ─────────────────────────────────────────────────────────
  NZL: 'nz',
  FIJ: 'fj',
  FJI: 'fj',
  SOL: 'sb',
  VAN: 'vu',
  VUT: 'vu',
  PNG: 'pg',
  TAH: 'pf',
  NCL: 'nc',
  SAM: 'ws',
  TGA: 'to',
  COK: 'ck',
  ASA: 'as',
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

        // Resolve to a flagcdn-valid ISO code. The map covers every FIFA member;
        // only fall back to the raw code if it's already a 2-letter ISO. A
        // lowercased 3-letter code is never valid on flagcdn (guaranteed 404), so
        // for anything else use the neutral 'white' placeholder and log it so a
        // genuinely new/missing code surfaces instead of silently breaking.
        const resolveCode = (tla) => {
          if (FIFA_TO_ISO[tla]) return FIFA_TO_ISO[tla];
          if (tla && tla.length === 2) return tla.toLowerCase();
          if (tla) console.warn(`getWcFixtures: no ISO flag mapping for code "${tla}"`);
          return 'white';
        };

        const homeCode = resolveCode(homeTeamTla);
        const awayCode = resolveCode(awayTeamTla);

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
