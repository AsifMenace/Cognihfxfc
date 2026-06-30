import { neon } from '@netlify/neon';

const sql = neon();

const CANONICAL = {
  czechia: 'czech',
  'czech republic': 'czech',
  'south korea': 'korea',
  'korea republic': 'korea',
  "côte d'ivoire": 'ivorycoast',
  "cote d'ivoire": 'ivorycoast',
  'ivory coast': 'ivorycoast',
  'bosnia and herzegovina': 'bosnia',
  'bosnia & herzegovina': 'bosnia',
  'united states': 'usa',
  usa: 'usa',
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

  const apiError = (d) =>
    d.errors && Object.keys(d.errors).length ? Object.values(d.errors)[0] : null;
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
  if (homeGoals == null || awayGoals == null) return { notFinished: true, status };

  let penaltyWinner = null;
  if (status === 'PEN' && homeGoals === awayGoals) {
    const penHome = fixture.score?.penalty?.home;
    const penAway = fixture.score?.penalty?.away;
    if (penHome != null && penAway != null) {
      penaltyWinner = penHome > penAway ? 'home' : 'away';
    }
  }

  return { homeGoals, awayGoals, penaltyWinner };
}

async function fetchFromFootballData(match) {
  const res = await fetch(`https://api.football-data.org/v4/matches/${match.fixture_id}`, {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
  });
  const data = await res.json();
  const matchData = data.match ?? data;
  const status = matchData.status;
  if (!FD_FINISHED.has(status)) return { notFinished: true, status };

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

  if (homeGoals == null || awayGoals == null) return { notFinished: true, status };

  let penaltyWinner = null;
  if (isPenaltyShootout) {
    const w = matchData.score?.winner;
    penaltyWinner = w === 'HOME_TEAM' ? 'home' : w === 'AWAY_TEAM' ? 'away' : null;
  }

  return { homeGoals, awayGoals, penaltyWinner };
}

export async function scheduleJob(matchId, atTime) {
  const baseUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
  const url = `${baseUrl}/.netlify/functions/autoFetchWcResult?match_id=${matchId}&secret=${process.env.AUTOFETCH_SECRET}`;
  const payload = {
    job: {
      url,
      enabled: true,
      schedule: {
        timezone: 'UTC',
        expiresAt: 0,
        hours: [atTime.getUTCHours()],
        minutes: [atTime.getUTCMinutes()],
        mdays: [atTime.getUTCDate()],
        months: [atTime.getUTCMonth() + 1],
        wdays: [-1],
      },
    },
  };
  console.log(
    '[scheduleJob] CRONJOB_API_KEY set:',
    !!process.env.CRONJOB_API_KEY,
    'SITE_URL:',
    baseUrl
  );
  console.log('[scheduleJob] sending payload:', JSON.stringify(payload));
  const res = await fetch('https://api.cron-job.org/jobs', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.CRONJOB_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log('[scheduleJob] status:', res.status, 'body:', text);
  if (!text) throw new Error(`cron-job.org returned HTTP ${res.status} with empty body`);
  const data = JSON.parse(text);
  if (!data.jobId) throw new Error(`cron-job.org error: ${text}`);
  return data.jobId;
}

export async function cancelJob(jobId) {
  if (!jobId) return;
  await fetch(`https://api.cron-job.org/jobs/${jobId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${process.env.CRONJOB_API_KEY}` },
  }).catch(() => {});
}

// Start polling 126 min after kickoff — catches regulation results on first fire.
// Retry every 15 min; give up after 240 min (covers worst-case ET + shootout + slow APIs).
// Exported so activateWcMatch / scheduleWcCron schedule the first poll at the
// same offset instead of hardcoding their own.
export const INITIAL_OFFSET_MINUTES = 126;
const RETRY_INTERVAL_MINUTES = 15;
const MAX_WINDOW_MINUTES = 240;

export const handler = async (event) => {
  const { secret, match_id } = event.queryStringParameters || {};

  if (!secret || secret !== process.env.AUTOFETCH_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }
  if (!match_id) {
    return { statusCode: 400, body: 'Missing match_id' };
  }

  const matches = await sql`SELECT * FROM wc_matches WHERE id = ${match_id}`;
  if (!matches.length) return { statusCode: 404, body: 'Match not found' };
  const match = matches[0];

  if (match.status === 'completed') {
    await cancelJob(match.cronjob_id);
    await sql`UPDATE wc_matches SET cronjob_id = NULL WHERE id = ${match_id}`;
    return { statusCode: 200, body: 'Already completed' };
  }

  const now = new Date();
  const minutesSinceKickoff = (now - new Date(match.kickoff_time)) / 60000;

  if (minutesSinceKickoff > MAX_WINDOW_MINUTES) {
    await cancelJob(match.cronjob_id);
    await sql`UPDATE wc_matches SET cronjob_id = NULL WHERE id = ${match_id}`;
    return { statusCode: 200, body: 'Retry window exceeded — use manual entry' };
  }

  // Lower bound: if we fire BEFORE the polling window (kickoff + INITIAL_OFFSET),
  // this is an early/manual invocation. Don't enter the 10-min retry loop (the
  // match hasn't happened) — reschedule once to the proper first-poll time and
  // exit. Without this, an early fire loops every 10 min until kickoff + 180.
  if (minutesSinceKickoff < INITIAL_OFFSET_MINUTES) {
    await cancelJob(match.cronjob_id);
    const firstPoll = new Date(new Date(match.kickoff_time).getTime() + INITIAL_OFFSET_MINUTES * 60000);
    try {
      const newJobId = await scheduleJob(match_id, firstPoll);
      await sql`UPDATE wc_matches SET cronjob_id = ${String(newJobId)} WHERE id = ${match_id}`;
      return { statusCode: 200, body: JSON.stringify({ message: 'Before polling window — rescheduled to kickoff+offset', next: firstPoll }) };
    } catch {
      await sql`UPDATE wc_matches SET cronjob_id = NULL WHERE id = ${match_id}`;
      return { statusCode: 200, body: 'Before polling window — reschedule failed' };
    }
  }

  // Try primary API, fall back to secondary
  let scoreData = null;
  try {
    const afData = await fetchFromApiFootball(match);
    if (afData && !afData.notFinished) scoreData = afData;
  } catch {}

  if (!scoreData) {
    try {
      const fdData = await fetchFromFootballData(match);
      if (fdData && !fdData.notFinished) scoreData = fdData;
    } catch {}
  }

  if (scoreData) {
    const { homeGoals, awayGoals } = scoreData;
    let result;
    if (homeGoals > awayGoals) result = 'home';
    else if (awayGoals > homeGoals) result = 'away';
    else if (match.is_knockout && scoreData.penaltyWinner) result = scoreData.penaltyWinner;
    else result = 'draw';

    await sql`
      UPDATE wc_matches
      SET result = ${result}, status = 'completed',
          final_home_goals = ${homeGoals}, final_away_goals = ${awayGoals},
          cronjob_id = NULL
      WHERE id = ${match_id}
    `;

    if (match.is_knockout) {
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

    await cancelJob(match.cronjob_id);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Result applied', result, homeGoals, awayGoals }),
    };
  }

  // Match not finished yet — delete this job and reschedule for +10 min
  await cancelJob(match.cronjob_id);
  const nextFetch = new Date(now.getTime() + RETRY_INTERVAL_MINUTES * 60000);
  try {
    const newJobId = await scheduleJob(match_id, nextFetch);
    await sql`UPDATE wc_matches SET cronjob_id = ${String(newJobId)} WHERE id = ${match_id}`;
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Not finished, rescheduled', next: nextFetch }),
    };
  } catch {
    await sql`UPDATE wc_matches SET cronjob_id = NULL WHERE id = ${match_id}`;
    return { statusCode: 200, body: 'Not finished — reschedule failed, use manual entry' };
  }
};
