-- Migration: admin-designated Banker match.
-- Run this in your Neon console once.
--
-- The admin picks ONE match per Halifax-local day as the "banker match" during
-- activation. Players may only place their Banker on that designated match.
-- "One banker match per day" is enforced in activateWcMatch.js; the rule that a
-- player's banker must land on it is enforced in submitPrediction.js.

ALTER TABLE wc_matches
  ADD COLUMN IF NOT EXISTS is_banker_match BOOLEAN NOT NULL DEFAULT FALSE;
