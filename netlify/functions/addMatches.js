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
    const { date, time, opponent, venue, result, competition, isHome } =
      JSON.parse(event.body);

    console.log("Parsed match data:", {
      date,
      time,
      opponent,
      venue,
      result,
      competition,
      isHome,
    });

    await sql`
  INSERT INTO matches (date, time, opponent, venue, result, competition, isHome)
  VALUES (
    ${date},
    ${time},
    ${opponent},
    ${venue},
    ${result && result.trim() !== "" ? result : null},
    ${competition && competition.trim() !== "" ? competition : null},
    ${typeof isHome === "boolean" ? isHome : true} -- default to true
  );
`;

    return {
      statusCode: 201,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Match added successfully" }),
    };
  } catch (err) {
    console.error("AddMatch error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
