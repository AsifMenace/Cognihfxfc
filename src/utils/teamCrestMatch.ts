import { getAdminHeaders } from "./auth";

// Top European leagues + Champions League + WC nationals — enough to cover
// almost anything a user would type, fast.
export const QUICK_COMPETITIONS = ["PL", "PD", "BL1", "SA", "FL1", "CL", "ELC", "WC"];

// Every competition available on this API plan — used for the slower,
// paced batch retrofit sweep.
export const ALL_COMPETITIONS = [
  "BSA", "ELC", "PL", "CL", "EC", "FL1", "BL1", "SA", "DED", "PPL", "CLI", "PD", "WC",
];

const DELAY_BETWEEN_CALLS_MS = 650;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Lowercase, strip common club legal-entity suffixes/prefixes, and drop
// punctuation so e.g. "FC Barcelona" and "Manchester United" (typed by an
// admin) line up with football-data.org's "FC Barcelona" / "Manchester
// United FC". Deliberately exact-match only (no substring matching) so a
// locally-invented team like "Halifax United" doesn't false-positive
// against a real club just for sharing a common word like "United".
export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\b(fc|cf|afc|sc|cd|rc|ac)\b/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Builds a normalized-name -> crest URL map by calling fetchCompetitionTeams
// once per competition code, one at a time with a short delay between calls
// (paced here in the browser, which has no execution timeout, rather than
// inside a single serverless function invocation, which does). On a rate
// limit response, waits for the reset window and retries once before moving
// on, so a single stuck competition can't block the rest of the sweep.
export async function buildCrestMap(
  competitionCodes: string[],
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, string>> {
  const crestMap = new Map<string, string>();

  for (let i = 0; i < competitionCodes.length; i++) {
    const code = competitionCodes[i];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("/.netlify/functions/fetchCompetitionTeams", {
          method: "POST",
          headers: getAdminHeaders(),
          body: JSON.stringify({ competitionCode: code }),
        });
        const data = await res.json();

        if (data.rateLimited) {
          await sleep((data.retryAfterSeconds || 60) * 1000);
          continue;
        }

        for (const team of data.teams || []) {
          const key = normalizeTeamName(team.name);
          if (key) crestMap.set(key, team.crest);
        }
        break;
      } catch {
        break;
      }
    }
    onProgress?.(i + 1, competitionCodes.length);
    await sleep(DELAY_BETWEEN_CALLS_MS);
  }

  return crestMap;
}
