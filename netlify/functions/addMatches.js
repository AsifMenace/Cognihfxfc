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
    const { date, time, opponent, venue, result } = JSON.parse(event.body);
    console.log("Parsed match data:", {
      date,
      time,
      opponent,
      venue,
      result,
      competition,
      ishome,
    });
    await sql`
      INSERT INTO matches (date, time, opponent, venue, result)
      VALUES (
        ${date}, ${time}, ${opponent}, ${venue}, ${result || null}
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
