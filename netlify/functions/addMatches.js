import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const {
      id, // optional for updates
      date,
      time,
      opponent,
      venue,
      result,
      competition,
      home_team_id,
      away_team_id,
      isHome,
    } = JSON.parse(event.body);

    console.log("Parsed match data:", {
      id,
      date,
      time,
      opponent,
      venue,
      result,
      competition,
      home_team_id,
      away_team_id,
      isHome,
    });

    // Validation: require either opponent or both teams present
    if (
      !((home_team_id && away_team_id) || (opponent && opponent.trim() !== ""))
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Provide either both home and away teams or a non-empty opponent.",
        }),
      };
    }

    if (home_team_id && away_team_id && home_team_id === away_team_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Home and away teams cannot be the same.",
        }),
      };
    }

    if (id) {
      // Update existing match
      await sql`
        UPDATE matches
        SET
          date = ${date},
          time = ${time},
          opponent = ${opponent || null},
          venue = ${venue},
          result = ${result && result.trim() !== "" ? result : null},
          competition = ${
            competition && competition.trim() !== "" ? competition : null
          },
          home_team_id = ${home_team_id || null},
          away_team_id = ${away_team_id || null},
          isHome = ${typeof isHome === "boolean" ? isHome : true}
        WHERE id = ${id}
      `;
    } else {
      // Insert new match
      await sql`
        INSERT INTO matches (date, time, opponent, venue, result, competition, home_team_id, away_team_id, isHome)
        VALUES (
          ${date},
          ${time},
          ${opponent || null},
          ${venue},
          ${result && result.trim() !== "" ? result : null},
          ${competition && competition.trim() !== "" ? competition : null},
          ${home_team_id || null},
          ${away_team_id || null},
          ${typeof isHome === "boolean" ? isHome : true}
        )
      `;
    }

    return {
      statusCode: 201,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: id ? "Match updated successfully" : "Match added successfully",
      }),
    };
  } catch (err) {
    console.error("AddMatch error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
