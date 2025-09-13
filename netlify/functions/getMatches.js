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
    const matches = await sql`SELECT m.*,
             t1.name AS home_team_name,
             t1.color AS home_team_color,
             t2.name AS away_team_name,
             t2.color AS away_team_color,
             t3.id AS opponent_id,t3.name AS opponent_name, t3.color AS opponent_color,
             t4.id AS cogni_id, t4.name AS cogni_name, t4.color AS cogni_color
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      LEFT JOIN teams t3 ON m.opponent = t3.name
      Left join teamS t4 on t4.name='Cogni HFX FC' and m.opponent = t3.name
      ORDER BY m.date DESC, m.time DESC;`;

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
