import { neon } from "@netlify/neon";
import webpush from "web-push";

const sql = neon();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

webpush.setVapidDetails(
  "mailto:admin@yourclub.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing notification payload" }),
    };
  }

  const payload = event.body; // JSON string with notification data {title, body}

  try {
    const subscriptions =
      await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions`;

    const sendPromises = subscriptions.map(({ endpoint, p256dh, auth }) => {
      const pushSubscription = {
        endpoint,
        keys: { p256dh, auth },
      };
      return webpush
        .sendNotification(pushSubscription, payload)
        .catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Remove stale subscription
            await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
          } else {
            console.error("Push error:", err);
          }
        });
    });

    await Promise.all(sendPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Notifications sent" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
