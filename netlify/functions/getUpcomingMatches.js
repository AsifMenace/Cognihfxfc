// functions/getUpcomingMatches.js
import { neon } from "@netlify/neon";

const sql = neon(process.env.DATABASE_URL);

export default async (req, context) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch upcoming matches (next 30 days from today)
    const matches = await sql`
      SELECT
        m.id,
        m.date,
        m.time,
        m.venue,
        m.competition,
        m.home_team_id,
        m.away_team_id,
        ht.name as home_team_name,
        ht.color as home_team_color,
        at.name as away_team_name,
        at.color as away_team_color,
        (SELECT COUNT(*) FROM squad_generations WHERE match_id = m.id) as linked_squad_count
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      WHERE m.date >= CURRENT_DATE
      AND m.date <= CURRENT_DATE + INTERVAL '30 days'
      AND m.home_team_id IS NOT NULL
      AND m.away_team_id IS NOT NULL
      ORDER BY m.date ASC, m.time ASC
      LIMIT 20
    `;

    if (!matches || matches.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          matches: [],
          message: "No upcoming matches found",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Format response
    const formattedMatches = matches.map((m) => ({
      id: m.id,
      date: m.date,
      time: m.time,
      venue: m.venue,
      competition: m.competition,
      homeTeam: {
        id: m.home_team_id,
        name: m.home_team_name,
        color: m.home_team_color,
      },
      awayTeam: {
        id: m.away_team_id,
        name: m.away_team_name,
        color: m.away_team_color,
      },
      displayName: `${m.home_team_name} vs ${m.away_team_name}`,
      hasLinkedSquad: m.linked_squad_count > 0,
      linkedSquadCount: m.linked_squad_count,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        matches: formattedMatches,
        total: formattedMatches.length,
        nextMatch: formattedMatches.length > 0 ? formattedMatches[0] : null,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
};
