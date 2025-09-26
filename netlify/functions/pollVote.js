import { neon } from "@netlify/neon";
const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { booking_id, player_id, vote } = JSON.parse(event.body);

    if (!booking_id || !player_id || !["in", "out"].includes(vote)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request parameters" }),
      };
    }

    // Check if vote already exists for this player and booking
    const existingVote = await sql`
      SELECT vote FROM poll_votes WHERE booking_id = ${booking_id} AND player_id = ${player_id}
    `;

    if (existingVote.length > 0) {
      if (existingVote[0].vote === vote) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: `You have already voted '${vote.toUpperCase()}'`,
          }),
        };
      }
      // Update vote to new choice
      await sql`
        UPDATE poll_votes SET vote = ${vote}, voted_at = NOW()
        WHERE booking_id = ${booking_id} AND player_id = ${player_id}
      `;
    } else {
      // Insert new vote
      await sql`
        INSERT INTO poll_votes (booking_id, player_id, vote)
        VALUES (${booking_id}, ${player_id}, ${vote})
      `;
    }

    // Fetch updated vote counts and detailed voters for IN and OUT
    const inPlayers = await sql`
      SELECT p.id, p.name, p.photo
      FROM poll_votes pv JOIN players p ON pv.player_id = p.id
      WHERE pv.booking_id = ${booking_id} AND pv.vote = 'in'
    `;
    const outPlayers = await sql`
      SELECT p.id, p.name, p.photo
      FROM poll_votes pv JOIN players p ON pv.player_id = p.id
      WHERE pv.booking_id = ${booking_id} AND pv.vote = 'out'
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "ok",
        inCount: inPlayers.length,
        outCount: outPlayers.length,
        inPlayers,
        outPlayers,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Internal Server Error",
      }),
    };
  }
};
