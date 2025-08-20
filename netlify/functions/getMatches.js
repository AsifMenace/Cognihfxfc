import { neon } from "@netlify/neon";

// Connect to your Neon DB
const sql = neon();

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const matches =
      await sql`SELECT * FROM matches ORDER BY date ASC, time ASC;`;

    const cleanMatches = matches.map(({ ishome, date, time, ...rest }) => {
      // Normalize date to YYYY-MM-DD string
      const formattedDate =
        date instanceof Date ? date.toISOString().slice(0, 10) : date;

      // Normalize time to HH:mm string
      let formattedTime = "TBD";
      if (typeof time === "string") {
        // If time comes as "21:00:00" string, take first 5 chars HH:mm
        formattedTime = time.slice(0, 5);
      } else if (time instanceof Date) {
        formattedTime = time.toTimeString().slice(0, 5);
      }

      return {
        ...rest,
        isHome: ishome,
        date: formattedDate,
        time: formattedTime,
      };
    });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(cleanMatches),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
