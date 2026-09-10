-- Migration: add a real logo/crest URL for teams.
-- Run this in your Neon console once.
--
-- Populated by looking up the team's name against football-data.org's
-- competition team lists (see netlify/functions/teamCrestLookup.js). Null
-- means no real crest was found — callers fall back to the generated
-- flag-pattern badge (TeamBadge.tsx).

ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT;
