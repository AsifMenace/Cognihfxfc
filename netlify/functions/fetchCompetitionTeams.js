import { validateAdmin } from "./validateAdmin.js";

// Fetches ONE football-data.org competition's team list per call — deliberately
// a single external request per invocation (no internal looping/waiting), so
// this can never approach the serverless function execution timeout. Looping
// across competitions and pacing around the free tier's 10-requests/minute
// limit is done client-side instead (see src/utils/teamCrestMatch.ts), where
// there's no such timeout.
export const handler = async (event) => {
  if (!validateAdmin(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { competitionCode } = JSON.parse(event.body);

    if (!competitionCode || typeof competitionCode !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "competitionCode is required" }),
      };
    }

    const res = await fetch(
      `https://api.football-data.org/v4/competitions/${competitionCode}/teams`,
      { headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY } }
    );

    if (res.status === 429) {
      const retryAfterSeconds = Number(res.headers.get("X-RequestCounter-Reset")) || 60;
      return {
        statusCode: 200,
        body: JSON.stringify({ rateLimited: true, retryAfterSeconds, teams: [] }),
      };
    }

    if (!res.ok) {
      return { statusCode: 200, body: JSON.stringify({ teams: [] }) };
    }

    const data = await res.json();
    const teams = (data.teams || [])
      .filter((t) => t.crest)
      .map((t) => ({ name: t.name, crest: t.crest }));

    return {
      statusCode: 200,
      body: JSON.stringify({ teams }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};
