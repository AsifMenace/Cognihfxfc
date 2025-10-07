import { neon } from "@netlify/neon";
import fetch from "node-fetch";

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
      video_url,
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
      video_url,
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
          isHome = ${typeof isHome === "boolean" ? isHome : true},
           video_url = ${video_url || null}        // <----- add here
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
          ${typeof isHome === "boolean" ? isHome : true},
          ${video_url || null}         // <----- add here
        )
      `;

      // Notify subscribers about the new match
      const notifPayload = JSON.stringify({
        title: "New Match Added!",
        body: `Date: ${date} Time: ${time} Venue: ${
          venue || "TBD"
        }. Check the app for more details.`,
      });

      const baseUrl = process.env.URL || "http://localhost:8888"; // Netlify sets URL in prod
      const sendNotificationUrl = `${baseUrl}/.netlify/functions/send-notifications`;

      await fetch(sendNotificationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: notifPayload,
      });
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
