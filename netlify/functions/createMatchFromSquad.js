import { neon } from '@netlify/neon';
import { verifyToken } from './sessionToken.js';

const sql = neon(process.env.DATABASE_URL);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function addMinutes(timeInput, minutes) {
  const str = timeInput.toString();
  const [h, m] = str.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function deriveCompetition(dateInput) {
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  // Neon returns date columns as Date objects; accept both Date and string
  if (typeof dateInput === 'string') {
    const [year, month] = dateInput.split('-');
    return `League ${monthNames[parseInt(month) - 1]} ${year}`;
  }
  return `League ${monthNames[dateInput.getUTCMonth()]} ${dateInput.getUTCFullYear()}`;
}

async function insertMatchPlayers(matchId, players, teamId) {
  for (const player of players) {
    await sql`
      INSERT INTO match_players (match_id, player_id, team_id)
      VALUES (${matchId}, ${player.id}, ${teamId})
    `;
  }
  if (players.length > 0) {
    const playerIds = players.map((p) => p.id);
    await sql`
      UPDATE players
      SET appearances = COALESCE(appearances, 0) + 1
      WHERE id = ANY(${playerIds})
    `;
  }
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Admin auth
  const token = req.headers.get('x-admin-token') || '';
  if (!verifyToken(token)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await req.json();
    const {
      squadId,
      squadCount = 2,
      // team IDs (registered teams in DB)
      teamAId,
      teamBId,
      teamCId = null,
      // player arrays
      teamAPlayers,
      teamBPlayers,
      teamCPlayers = null,
    } = body;

    if (!squadId || !teamAId || !teamBId || !teamAPlayers || !teamBPlayers) {
      return json({ error: 'Missing required fields' }, 400);
    }

    if (squadCount === 3 && (!teamCId || !teamCPlayers)) {
      return json({ error: 'teamCId and teamCPlayers required for 3-squad mode' }, 400);
    }

    if (squadCount === 3 && (teamAId === teamBId || teamBId === teamCId || teamAId === teamCId)) {
      return json({ error: 'All three squads must be assigned to different teams' }, 400);
    }

    if (squadCount === 2 && teamAId === teamBId) {
      return json({ error: 'Both squads cannot be assigned to the same team' }, 400);
    }

    // ── Get next upcoming booking ────────────────────────────────────────────
    const bookings = await sql`
      SELECT id, booking_date, start_time, end_time, session, field_number
      FROM field_bookings
      WHERE booking_date >= CURRENT_DATE
      ORDER BY booking_date ASC, start_time ASC
      LIMIT 1
    `;

    if (!bookings || bookings.length === 0) {
      return json({ error: 'No upcoming bookings found. Please add a booking first.' }, 400);
    }

    const booking = bookings[0];
    const matchDate = booking.booking_date;
    const matchTime = booking.start_time;
    const matchVenue = booking.session
      ? `${booking.session}${booking.field_number ? ` - Field ${booking.field_number}` : ''}`
      : 'TBD';
    const competition = deriveCompetition(matchDate);

    // ── Conflict check: do matches already exist for this booking date? ───────
    // We look for internal matches (both team IDs set) on that date involving our teams
    const teamIds = squadCount === 3
      ? [teamAId, teamBId, teamCId]
      : [teamAId, teamBId];

    const existingMatches = await sql`
      SELECT id, home_team_id, away_team_id
      FROM matches
      WHERE date = ${matchDate}
      AND home_team_id = ANY(${teamIds})
      AND away_team_id = ANY(${teamIds})
      AND home_team_id IS NOT NULL
      AND away_team_id IS NOT NULL
    `;

    let matchIds;
    let created = false;

    if (squadCount === 2) {
      if (existingMatches.length > 0) {
        // Reuse the existing match between these two teams
        const existing = existingMatches[0];
        matchIds = [existing.id];

        // Decrement appearances for old players before clearing
        const oldPlayers = await sql`SELECT player_id FROM match_players WHERE match_id = ${existing.id}`;
        if (oldPlayers.length > 0) {
          const oldIds = oldPlayers.map((p) => p.player_id);
          await sql`UPDATE players SET appearances = GREATEST(0, COALESCE(appearances, 0) - 1) WHERE id = ANY(${oldIds})`;
        }

        // Clear old match_players
        await sql`DELETE FROM match_players WHERE match_id = ${existing.id}`;

        // Unlink any previously linked squad
        await sql`
          UPDATE squad_generations
          SET match_id = NULL, status = 'created', linked_at = NULL
          WHERE match_id = ${existing.id} AND id != ${squadId}
        `;
      } else {
        // Create 1 new match
        const [newMatch] = await sql`
          INSERT INTO matches (date, time, venue, competition, home_team_id, away_team_id, isHome)
          VALUES (${matchDate}, ${matchTime}, ${matchVenue}, ${competition}, ${teamAId}, ${teamBId}, true)
          RETURNING id
        `;
        matchIds = [newMatch.id];
        created = true;
      }

      await insertMatchPlayers(matchIds[0], teamAPlayers, teamAId);
      await insertMatchPlayers(matchIds[0], teamBPlayers, teamBId);

    } else {
      // 3-squad: pairs are A vs B, B vs C, C vs A
      const pairs = [
        { home: teamAId, away: teamBId, homePlayers: teamAPlayers, awayPlayers: teamBPlayers, time: matchTime },
        { home: teamBId, away: teamCId, homePlayers: teamBPlayers, awayPlayers: teamCPlayers, time: addMinutes(matchTime, 15) },
        { home: teamCId, away: teamAId, homePlayers: teamCPlayers, awayPlayers: teamAPlayers, time: addMinutes(matchTime, 30) },
      ];

      matchIds = [];

      for (const pair of pairs) {
        // Check if a match already exists for this pair on this date
        const existingPair = existingMatches.find(
          (m) =>
            (m.home_team_id === pair.home && m.away_team_id === pair.away) ||
            (m.home_team_id === pair.away && m.away_team_id === pair.home)
        );

        let matchId;
        if (existingPair) {
          matchId = existingPair.id;
          // Decrement appearances for old players before clearing
          const oldPlayers = await sql`SELECT player_id FROM match_players WHERE match_id = ${matchId}`;
          if (oldPlayers.length > 0) {
            const oldIds = oldPlayers.map((p) => p.player_id);
            await sql`UPDATE players SET appearances = GREATEST(0, COALESCE(appearances, 0) - 1) WHERE id = ANY(${oldIds})`;
          }
          await sql`DELETE FROM match_players WHERE match_id = ${matchId}`;
          await sql`
            UPDATE squad_generations
            SET match_id = NULL, status = 'created', linked_at = NULL
            WHERE match_id = ${matchId} AND id != ${squadId}
          `;
        } else {
          const [newMatch] = await sql`
            INSERT INTO matches (date, time, venue, competition, home_team_id, away_team_id, isHome)
            VALUES (${matchDate}, ${pair.time}, ${matchVenue}, ${competition}, ${pair.home}, ${pair.away}, true)
            RETURNING id
          `;
          matchId = newMatch.id;
          created = true;
        }

        await insertMatchPlayers(matchId, pair.homePlayers, pair.home);
        await insertMatchPlayers(matchId, pair.awayPlayers, pair.away);
        matchIds.push(matchId);
      }
    }

    // ── Update squad_generations ─────────────────────────────────────────────
    await sql`
      UPDATE squad_generations
      SET
        match_id = ${matchIds[0]},
        status = 'linked',
        linked_at = NOW(),
        updated_at = NOW()
      WHERE id = ${squadId}
    `;

    // ── Fetch team names for the response ────────────────────────────────────
    const allTeamIds = squadCount === 3 ? [teamAId, teamBId, teamCId] : [teamAId, teamBId];
    const teams = await sql`SELECT id, name FROM teams WHERE id = ANY(${allTeamIds})`;
    const teamNameMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

    const pairings =
      squadCount === 3
        ? [
            `${teamNameMap[teamAId]} vs ${teamNameMap[teamBId]} · ${matchTime}`,
            `${teamNameMap[teamBId]} vs ${teamNameMap[teamCId]} · ${addMinutes(matchTime, 15)}`,
            `${teamNameMap[teamCId]} vs ${teamNameMap[teamAId]} · ${addMinutes(matchTime, 30)}`,
          ]
        : [`${teamNameMap[teamAId]} vs ${teamNameMap[teamBId]}`];

    return json({
      success: true,
      created,
      matchIds,
      matchDate,
      matchTime,
      matchVenue,
      pairings,
      message: created
        ? `${squadCount === 3 ? '3 matches' : '1 match'} created successfully!`
        : `Linked to existing ${squadCount === 3 ? 'matches' : 'match'} — players updated.`,
    });
  } catch (error) {
    console.error('createMatchFromSquad error:', error);
    return json({ success: false, error: error.message }, 500);
  }
};
