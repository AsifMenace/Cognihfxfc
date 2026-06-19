-- Migration: optional bonus trivia (multiple-choice) per match.
-- Run this in your Neon console once.
--
-- A match may carry ONE multiple-choice bonus question, set by the admin at
-- activation. Players tap one option alongside their prediction (optional). After
-- the match the admin sets the correct option; matching guesses earn +1 (no
-- negatives). Trivia is scored independently of match results and the banker —
-- it lives in its own columns and only adds to the leaderboard TOTAL.
--
--   wc_matches.trivia_question  — the question text (NULL = no trivia)
--   wc_matches.trivia_options   — JSON array of choices, e.g. ["0","1","2","3+"]
--   wc_matches.trivia_answer    — correct option index; NULL = unset, -1 = "none of the options"
--   wc_predictions.trivia_guess — chosen option index (NULL = unanswered)
--   wc_predictions.trivia_points— 1 if the guess matched the answer, else 0

ALTER TABLE wc_matches
  ADD COLUMN IF NOT EXISTS trivia_question TEXT,
  ADD COLUMN IF NOT EXISTS trivia_options  TEXT,
  ADD COLUMN IF NOT EXISTS trivia_answer   INT;

ALTER TABLE wc_predictions
  ADD COLUMN IF NOT EXISTS trivia_guess  INT,
  ADD COLUMN IF NOT EXISTS trivia_points INT NOT NULL DEFAULT 0;
