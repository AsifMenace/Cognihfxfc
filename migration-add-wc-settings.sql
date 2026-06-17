-- Migration: global WC prediction settings (one row).
-- Run this in your Neon console once.
--
-- banker_mode controls how the daily Banker works:
--   'admin' — admin designates one banker match per day (wc_matches.is_banker_match);
--             players may only banker that match. (current default behaviour)
--   'user'  — each player freely picks their own banker, one per Halifax-local day.
--
-- The flag is read by getActiveWcMatch.js (exposed to both pages) and enforced in
-- submitPrediction.js. Switching modes never rescore or alters existing predictions.

CREATE TABLE IF NOT EXISTS wc_settings (
  id INT PRIMARY KEY DEFAULT 1,
  banker_mode TEXT NOT NULL DEFAULT 'admin',
  CHECK (id = 1)
);

INSERT INTO wc_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
