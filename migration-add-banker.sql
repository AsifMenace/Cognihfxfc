-- Migration: add Banker (double-down) support to WC predictions.
-- Run this in your Neon console once.
--
-- A banker is one pick per Halifax-local match-day that a player doubles down on:
--   correct banker  -> +2 points
--   wrong banker    -> -1 point
-- Normal picks stay +1 / 0. "One per day" is enforced in submitPrediction.js.

ALTER TABLE wc_predictions
  ADD COLUMN IF NOT EXISTS is_banker BOOLEAN NOT NULL DEFAULT FALSE;
