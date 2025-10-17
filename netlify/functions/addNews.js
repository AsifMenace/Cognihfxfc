import { neon } from "@netlify/neon";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { title, description, image_url } = JSON.parse(event.body);
    const sql = neon();

    await sql`
      INSERT INTO news (title, description, image_url)
      VALUES (${title}, ${description}, ${image_url});
    `;

    // Notify subscribers about the new match
    const notifPayload = JSON.stringify({
      title: "Breaking News Added!",
      body: `${title}`,
    });

    const baseUrl = process.env.URL || "http://localhost:8888"; // Netlify sets URL in prod
    const sendNotificationUrl = `${baseUrl}/.netlify/functions/send-notifications`;

    await fetch(sendNotificationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: notifPayload,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "News added successfully!" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to add news" }),
    };
  }
}
