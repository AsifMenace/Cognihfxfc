import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async () => {
  try {
    const newsItems = await sql`
      SELECT id, title, description, image_url
      FROM news
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(newsItems),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
