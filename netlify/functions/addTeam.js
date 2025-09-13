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
    const { name, color, description } = JSON.parse(event.body);

    if (!name || typeof name !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Team name is required" }),
      };
    }

    const teamColor = color && typeof color === "string" ? color : "#000000";

    // Optional: check if team name already exists
    const existing = await sql`
      SELECT id FROM teams WHERE name = ${name}
    `;
    if (existing.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "Team name already exists" }),
      };
    }

    const result = await sql`
      INSERT INTO teams (name, color, description)
      VALUES (${name}, ${teamColor}, ${description || ""})
      RETURNING id, name, color, description
    `;

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Team added successfully",
        team: result[0],
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};
