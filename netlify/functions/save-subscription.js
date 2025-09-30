import { neon } from "@netlify/neon";

const sql = neon();

export const handler = async (event) => {
  console.log("Received subscription save request");
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const subscription = JSON.parse(event.body || "{}");
    const { endpoint, keys } = subscription;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid subscription object" }),
      };
    }

    // Upsert subscription by endpoint
    await sql`
      INSERT INTO push_subscriptions (endpoint, p256dh, auth)
      VALUES (${endpoint}, ${keys.p256dh}, ${keys.auth})
      ON CONFLICT (endpoint)
      DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Subscription saved" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
