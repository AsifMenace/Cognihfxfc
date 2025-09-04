import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  // Handle CORS preflight for dev environment
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    // Validate required fields
    const {
      name,
      position,
      age,
      nationality,
      jerseyNumber,
      height,
      weight,
      goals,
      assists,
      appearances,
      photo, // Cloudinary URL here
      bio,
    } = data;

    if (!name || !position || !age || !nationality || !jerseyNumber) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const DEFAULT_IMG =
      "https://res.cloudinary.com/mycloudasif/image/upload/v1756276511/abc_ivaom4.jpg";
    const playerPhoto = photo && photo.trim() !== "" ? photo : DEFAULT_IMG;

    await sql`
      INSERT INTO players
        (name, position, age, nationality, jersey_number, height, weight, goals, assists, appearances, photo, bio)
      VALUES
        (${name}, ${position}, ${age}, ${nationality}, ${jerseyNumber}, ${height}, ${weight}, ${
      goals || 0
    }, ${assists || 0}, ${appearances || 0}, ${playerPhoto}, ${bio || ""});
    `;

    return {
      statusCode: 201,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Player added successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
