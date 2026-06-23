import { neon } from '@netlify/neon';
import { scheduleJob, cancelJob, INITIAL_OFFSET_MINUTES } from './autoFetchWcResult.js';

const sql = neon();

// Schedule (or reschedule) the auto-fetch cron job for an already-activated
// match. Used to backfill jobs for matches activated before auto-fetch existed,
// and to retry after a scheduling failure. Does not touch predictions.
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
    const { match_id } = JSON.parse(event.body || '{}');
    if (!match_id) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing match_id' }) };
    }

    const matches = await sql`
      SELECT id, status, kickoff_time, cronjob_id FROM wc_matches WHERE id = ${match_id}
    `;
    if (matches.length === 0) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Match not found' }) };
    }
    const match = matches[0];

    if (match.status === 'completed') {
      return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: 'Match is already completed' }) };
    }

    // Auto-fetch fires INITIAL_OFFSET_MINUTES after kickoff — only schedulable if still future.
    const fetchAt = new Date(new Date(match.kickoff_time).getTime() + INITIAL_OFFSET_MINUTES * 60 * 1000);
    if (fetchAt <= new Date()) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Auto-fetch time (kickoff + ${INITIAL_OFFSET_MINUTES} min) has already passed — use manual entry` }),
      };
    }

    // Cancel any existing job first so we don't orphan it on the cron provider.
    if (match.cronjob_id) await cancelJob(match.cronjob_id);

    const jobId = await scheduleJob(match.id, fetchAt);
    await sql`UPDATE wc_matches SET cronjob_id = ${String(jobId)} WHERE id = ${match.id}`;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Auto-fetch scheduled', jobId, fetchAt }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
