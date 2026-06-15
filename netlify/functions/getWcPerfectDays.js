import { neon } from '@netlify/neon';

const sql = neon();

// Halifax-local calendar date (YYYY-MM-DD) for an instant. en-CA gives an
// ISO-style date that sorts lexicographically. kickoff_time is an ISO-UTC
// string (football-data utcDate), so new Date() parses it to the right instant
// regardless of how the column round-trips.
const halifaxDay = (iso) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Halifax',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));

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
    const matches = await sql`
      SELECT id, kickoff_time, status, result
      FROM wc_matches
      WHERE status IN ('active', 'locked', 'completed')
    `;

    if (matches.length === 0) {
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ days: [] }) };
    }

    const predictions = await sql`
      SELECT
        wp.match_id,
        wp.player_id,
        wp.points,
        p.name AS player_name,
        p.photo AS player_photo
      FROM wc_predictions wp
      JOIN players p ON p.id = wp.player_id
    `;

    // Group matches by Halifax-local day.
    const dayMatches = new Map(); // day -> [{ id, status, result }]
    for (const m of matches) {
      const day = halifaxDay(m.kickoff_time);
      if (!dayMatches.has(day)) dayMatches.set(day, []);
      dayMatches.get(day).push(m);
    }

    // Index predictions by match for quick lookup.
    const predsByMatch = new Map(); // match_id -> [pred]
    for (const pred of predictions) {
      if (!predsByMatch.has(pred.match_id)) predsByMatch.set(pred.match_id, []);
      predsByMatch.get(pred.match_id).push(pred);
    }

    const days = [];

    for (const [day, dayGames] of dayMatches) {
      // Only reveal a day once EVERY game that day has finished.
      const allCompleted = dayGames.every(
        (g) => g.status === 'completed' && g.result !== null
      );
      if (!allCompleted) continue;

      const gameIds = dayGames.map((g) => g.id);

      // Tally each player's predictions across the day's games.
      const tally = new Map(); // player_id -> { name, photo, predicted, correct }
      for (const id of gameIds) {
        for (const pred of predsByMatch.get(id) ?? []) {
          let t = tally.get(pred.player_id);
          if (!t) {
            t = {
              player_id: pred.player_id,
              player_name: pred.player_name,
              player_photo: pred.player_photo,
              predicted: 0,
              correct: 0,
            };
            tally.set(pred.player_id, t);
          }
          t.predicted += 1;
          if (pred.points > 0) t.correct += 1; // 1 (normal) or 2 (banker)
        }
      }

      // Perfect = predicted EVERY game that day AND got them all right.
      const perfect = [...tally.values()]
        .filter((t) => t.predicted === gameIds.length && t.correct === gameIds.length)
        .map((t) => ({
          player_id: t.player_id,
          player_name: t.player_name,
          player_photo: t.player_photo,
        }))
        .sort((a, b) => a.player_name.localeCompare(b.player_name));

      if (perfect.length === 0) continue;

      days.push({
        day,
        game_count: gameIds.length,
        perfect_players: perfect,
      });
    }

    // Most recent day first.
    days.sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ days }) };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
