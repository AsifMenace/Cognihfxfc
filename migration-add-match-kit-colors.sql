-- Migration: add per-match kit color overrides for home/away teams.
-- Run this in your Neon console once.
--
-- These are one-off overrides for a single match's shared lineup image
-- (e.g. avoiding a color clash). They must NEVER be written back to
-- teams.color. When null, callers fall back to teams.color.

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS home_kit_color TEXT,
  ADD COLUMN IF NOT EXISTS away_kit_color TEXT;
