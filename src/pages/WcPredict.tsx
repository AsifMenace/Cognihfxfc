import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Share2,
  Flame,
  Star,
  RefreshCw,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';

interface Match {
  id: number;
  fixture_id: number;
  home_team: string;
  away_team: string;
  home_code: string;
  away_code: string;
  home_flag: string;
  away_flag: string;
  kickoff_time: string;
  status: string;
  result: string | null;
  live_home_goals: number | null;
  live_away_goals: number | null;
  live_fetched_at: string | null;
  final_home_goals: number | null;
  final_away_goals: number | null;
  is_banker_match: boolean;
  is_knockout: boolean;
  trivia_question: string | null;
  trivia_options: string | null; // JSON array string, e.g. '["0","1","2","3+"]'
  trivia_answer: number | null; // correct index; null = unset, -1 = none of the options
  predictions: Prediction[];
}

interface Prediction {
  match_id: number;
  player_id: number;
  player_name: string;
  player_photo: string;
  prediction: string;
  points: number;
  score_points: number;
  is_banker: boolean;
  trivia_guess: number | null;
  trivia_points: number;
  // Knockout-only fields (null for group stage predictions)
  predicted_home_goals: number | null;
  predicted_away_goals: number | null;
  predicted_winner: string | null;
}

interface Player {
  id: number;
  name: string;
  photo?: string;
}

interface LeaderboardEntry {
  player_id: number;
  player_name: string;
  player_photo: string;
  total_points: number;
  predictions_made: number;
  correct_predictions: number;
}

interface PerfectDay {
  day: string; // YYYY-MM-DD (game day, US Eastern)
  game_count: number;
  perfect_players: { player_id: number; player_name: string; player_photo: string }[];
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

// Official game day (US Eastern) calendar date (YYYY-MM-DD) — defines "a day" for the user-mode
// one-banker-per-day rule. Mirrors the backend (getWcPerfectDays.js).
function gameDay(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

// Parse a match's stored trivia options (JSON array string) into a list.
function parseTriviaOptions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map((o) => String(o)) : [];
  } catch {
    return [];
  }
}

function FlagImg({
  src,
  alt,
  size = 'md',
}: {
  src: string | null | undefined;
  alt: string;
  size?: 'sm' | 'md';
}) {
  const [err, setErr] = useState(false);
  if (!src || err) return <span style={{ fontSize: size === 'sm' ? 16 : 22 }}>🏳️</span>;
  const cls = size === 'sm' ? 'w-7 h-5 object-cover rounded' : 'w-12 h-8 object-cover rounded';
  return (
    <img
      src={src}
      alt={alt}
      className={cls}
      style={{ border: '1px solid rgba(0,0,0,0.15)' }}
      onError={() => setErr(true)}
    />
  );
}

function PlayerAvatar({ photo, name, size = 7 }: { photo?: string; name: string; size?: number }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
    >
      {name.charAt(0)}
    </div>
  );
}

// Leaderboard avatar — sizes via inline style (survives Tailwind purge), optional ring.
function LeaderAvatar({
  photo,
  name,
  px,
  ringColor,
  glow = false,
}: {
  photo?: string;
  name: string;
  px: number;
  ringColor?: string;
  glow?: boolean;
}) {
  const ringStyle: React.CSSProperties = ringColor
    ? {
        boxShadow: `0 0 0 3px ${ringColor}${
          glow ? `, 0 0 18px ${ringColor}66` : ''
        }, 0 6px 16px rgba(0,0,0,0.45)`,
      }
    : { boxShadow: '0 4px 12px rgba(0,0,0,0.4)' };

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: px, height: px, ...ringStyle }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 bg-gradient-to-br from-slate-600 to-slate-800"
      style={{ width: px, height: px, fontSize: px * 0.4, ...ringStyle }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Countdown ───────────────────────────────────────────────────────────────

function Countdown({ kickoff, onLock }: { kickoff: string; onLock?: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(kickoff).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Kicked off');
        if (!locked) {
          setLocked(true);
          onLock?.();
        }
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [kickoff, locked, onLock]);

  return (
    <div
      className={`flex items-center gap-2 text-sm font-semibold ${locked ? 'text-red-400' : 'text-amber-400'}`}
    >
      <Clock size={14} />
      {locked ? 'Predictions locked' : `Locks in ${timeLeft}`}
    </div>
  );
}

// ─── Live score banner ────────────────────────────────────────────────────────

function LiveScoreBanner({ match }: { match: Match }) {
  if (
    match.live_home_goals === null ||
    match.live_away_goals === null ||
    match.status === 'completed'
  ) {
    return null;
  }

  const fetchedAt = match.live_fetched_at
    ? new Date(match.live_fetched_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="mx-4 mb-1 rounded-xl overflow-hidden border border-amber-500/30 bg-amber-500/10">
      <div className="flex items-center justify-center gap-2 px-4 pt-2.5 pb-1">
        <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
          Live
        </span>
        <span className="text-amber-300 text-xs font-medium">Match in progress</span>
      </div>
      <div className="flex items-center justify-center gap-4 px-4 py-2">
        <span className="text-white font-bold text-sm text-right flex-1">{match.home_team}</span>
        <span className="text-white font-black text-3xl tabular-nums tracking-tight">
          {match.live_home_goals}
          <span className="text-slate-400 mx-1 font-light">–</span>
          {match.live_away_goals}
        </span>
        <span className="text-white font-bold text-sm text-left flex-1">{match.away_team}</span>
      </div>
      <div className="flex items-center justify-center gap-1.5 px-4 pb-2.5 pt-0.5">
        <Activity size={11} className="text-amber-400 flex-shrink-0" />
        <p className="text-amber-400/80 text-xs text-center leading-tight">
          Score is not final — points will only be awarded once the match ends.
          {fetchedAt && <span className="text-slate-500 ml-1">Last updated {fetchedAt}.</span>}
        </p>
      </div>
    </div>
  );
}

// ─── Predictions list (shared, collapsible) ───────────────────────────────────

function PointsBadge({ points }: { points: number }) {
  return (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded-full ml-1 ${
        points > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      }`}
    >
      {points > 0 ? `+${points}` : `${points}`}
    </span>
  );
}

// Star marking a banker pick (2× points, −2 if wrong in knockout).
function BankerStar({ size = 12 }: { size?: number }) {
  return (
    <span title="Banker · 2× points if correct · −2 if wrong (knockout)" className="inline-flex items-center">
      <Star size={size} className="text-amber-400 fill-amber-400" />
    </span>
  );
}

function PredictionsList({
  predictions,
  match,
  defaultOpen = true,
}: {
  predictions: Prediction[];
  match: Match;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [activePick, setActivePick] = useState<'home' | 'draw' | 'away' | 'score' | null>(null);

  if (predictions.length === 0) return null;

  const isCompleted = match.status === 'completed';
  // For knockout, prediction column stores the winner ('home'/'away'). No draw tab.
  const picks = match.is_knockout
    ? [
        { val: 'home' as const, label: match.home_team },
        { val: 'away' as const, label: match.away_team },
      ]
    : [
        { val: 'home' as const, label: match.home_team },
        { val: 'draw' as const, label: 'Draw' },
        { val: 'away' as const, label: match.away_team },
      ];
  const votersFor = (val: 'home' | 'draw' | 'away') =>
    predictions.filter((p) => p.prediction === val);
  const scorerVoters = predictions.filter((p) => (p.score_points ?? 0) > 0);
  const activeVoters = activePick === 'score' ? scorerVoters : activePick ? votersFor(activePick) : [];
  const activeLabel = activePick === 'score' ? 'the exact score' : picks.find((p) => p.val === activePick)?.label ?? '';

  return (
    <div className="border-t border-slate-700/50">
      {/* Vote breakdown — tap a side to see who picked it */}
      <div className="px-5 pt-3 pb-1">
        <div className={`grid gap-2 ${match.is_knockout && isCompleted ? 'grid-cols-3' : match.is_knockout ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {picks.map(({ val, label }) => {
            const count = votersFor(val).length;
            const active = activePick === val;
            const isResult = isCompleted && match.result === val;
            return (
              <button
                key={val}
                onClick={() => setActivePick((p) => (p === val ? null : val))}
                className={`flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl border text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-green-600/20 border-green-500/50 text-white'
                    : isResult
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 hover:border-amber-400/60'
                      : 'bg-slate-700/40 border-slate-600/40 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span className="truncate max-w-full leading-tight">{label}</span>
                <span
                  className={`text-base font-black leading-none ${
                    active ? 'text-green-300' : isResult ? 'text-amber-300' : 'text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
          {/* Exact scoreline filter — knockout completed only */}
          {match.is_knockout && isCompleted && (
            <button
              onClick={() => setActivePick((p) => (p === 'score' ? null : 'score'))}
              className={`flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl border text-xs font-semibold transition-colors ${
                activePick === 'score'
                  ? 'bg-green-600/20 border-green-500/50 text-white'
                  : 'bg-teal-500/10 border-teal-500/30 text-teal-200 hover:border-teal-400/50'
              }`}
            >
              <span className="leading-tight">🎯 Exact ⚽</span>
              <span className={`text-[10px] tabular-nums leading-tight ${activePick === 'score' ? 'text-slate-300' : 'text-teal-300/70'}`}>
                {match.final_home_goals}–{match.final_away_goals}
              </span>
              <span className={`text-base font-black leading-none ${activePick === 'score' ? 'text-green-300' : 'text-teal-300'}`}>
                {scorerVoters.length}
              </span>
            </button>
          )}
        </div>

        {activePick && (
          <div className="mt-2 rounded-xl bg-slate-900/40 border border-slate-700/40 overflow-hidden">
            {activeVoters.length === 0 ? (
              <p className="text-slate-500 text-xs px-4 py-3">No one picked {activeLabel}.</p>
            ) : (
              <div className="divide-y divide-slate-700/40">
                {activeVoters.map((pred) => (
                  <div key={pred.player_id} className="flex items-center gap-3 px-4 py-2.5">
                    <PlayerAvatar photo={pred.player_photo} name={pred.player_name} size={7} />
                    <span className="text-white text-sm font-medium flex-1 flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{pred.player_name}</span>
                      {pred.is_banker && <BankerStar />}
                    </span>
                    {match.is_knockout && pred.predicted_home_goals != null && (
                      <span className="text-slate-400 text-xs tabular-nums shrink-0">
                        {pred.predicted_home_goals}–{pred.predicted_away_goals}
                      </span>
                    )}
                    {isCompleted && <PointsBadge points={activePick === 'score' ? (pred.score_points || 0) : pred.points} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-2.5 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Predictions
          <span className="ml-2 text-slate-600 font-normal normal-case tracking-normal">
            ({predictions.length})
          </span>
        </span>
        {open ? (
          <ChevronUp size={14} className="text-slate-500" />
        ) : (
          <ChevronDown size={14} className="text-slate-500" />
        )}
      </button>

      {open && (
        <div className="divide-y divide-slate-700/40">
          {predictions.map((pred) => (
            <div key={pred.player_id} className="flex items-center gap-3 px-5 py-2.5">
              <PlayerAvatar photo={pred.player_photo} name={pred.player_name} size={7} />
              <span className="text-white text-sm font-medium flex-1 flex items-center gap-1.5">
                {pred.player_name}
                {pred.is_banker && <BankerStar />}
              </span>
              <span className="text-xs text-slate-400 text-right">
                {match.is_knockout && pred.predicted_home_goals !== null
                  ? `${pred.predicted_home_goals}–${pred.predicted_away_goals}${pred.predicted_winner ? ` · ${pred.predicted_winner === 'home' ? match.home_team : match.away_team}` : ''}`
                  : pred.prediction === 'home'
                    ? match.home_team
                    : pred.prediction === 'away'
                      ? match.away_team
                      : 'Draw'}
              </span>
              {isCompleted && <PointsBadge points={(pred.points || 0) + (pred.score_points || 0)} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bankers summary ──────────────────────────────────────────────────────────

// At-a-glance "who bankered this match" panel — separate from the full
// predictions list. Shown on locked and completed cards. On completed matches it
// also shows each banker's +2 / −1 result.
function BankersSummary({ match }: { match: Match }) {
  const [open, setOpen] = useState(false);
  const bankers = match.predictions.filter((p) => p.is_banker);
  const isCompleted = match.status === 'completed';
  const pickLabel = (b: Prediction) =>
    match.is_knockout && b.predicted_home_goals !== null
      ? `${b.predicted_home_goals}–${b.predicted_away_goals}${b.predicted_winner ? ` · ${b.predicted_winner === 'home' ? match.home_team : match.away_team}` : ''}`
      : b.prediction === 'home'
        ? match.home_team
        : b.prediction === 'away'
          ? match.away_team
          : 'Draw';

  if (bankers.length === 0) {
    return (
      <div className="px-5 py-3 border-t border-slate-700/50">
        <p className="text-slate-500 text-xs flex items-center gap-1.5">
          <Star size={12} className="text-slate-600" />
          No bankers on this match.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-3 border-t border-slate-700/50">
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-amber-500/5 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">Bankers</span>
            <span className="text-amber-400/70 text-xs">({bankers.length})</span>
          </span>
          {open ? (
            <ChevronUp size={14} className="text-amber-400/70" />
          ) : (
            <ChevronDown size={14} className="text-amber-400/70" />
          )}
        </button>
        {open && (
          <div className="divide-y divide-amber-500/10 border-t border-amber-500/20">
            {bankers.map((b) => (
              <div key={b.player_id} className="flex items-center gap-3 px-4 py-2.5">
                <PlayerAvatar photo={b.player_photo} name={b.player_name} size={7} />
                <span className="text-white text-sm font-medium flex-1 min-w-0 truncate">
                  {b.player_name}
                </span>
                <span className="text-xs text-slate-300">{pickLabel(b)}</span>
                {isCompleted && <PointsBadge points={b.points} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bonus trivia summary ─────────────────────────────────────────────────────

// Collapsible "bonus question" recap — shown on locked & completed cards. Lists
// each player's pick; once the admin sets the answer, the correct option is
// highlighted and winners show +1.
function TriviaSummary({ match }: { match: Match }) {
  const [open, setOpen] = useState(false);
  if (!match.trivia_question) return null;

  const options = parseTriviaOptions(match.trivia_options);
  const answer = match.trivia_answer; // null = unset, -1 = none, >=0 = index
  const resulted = answer !== null;
  const answerLabel =
    answer === null
      ? 'Awaiting result'
      : answer === -1
        ? 'None of the options'
        : (options[answer] ?? '—');

  const answered = match.predictions.filter((p) => p.trivia_guess !== null);

  return (
    <div className="px-5 py-3 border-t border-slate-700/50">
      <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-4 py-2 hover:bg-sky-500/5 transition-colors"
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <Lightbulb size={13} className="text-sky-400 flex-shrink-0" />
            <span className="text-sky-300 text-xs font-bold uppercase tracking-wider flex-shrink-0">
              Bonus
            </span>
            <span className="text-slate-300 text-xs truncate normal-case font-normal tracking-normal">
              {match.trivia_question}
            </span>
          </span>
          {open ? (
            <ChevronUp size={14} className="text-sky-400/70 flex-shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-sky-400/70 flex-shrink-0" />
          )}
        </button>
        {open && (
          <div className="border-t border-sky-500/20">
            <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 text-xs">Answer:</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  resulted ? 'bg-sky-500/20 text-sky-200' : 'bg-slate-700/60 text-slate-400'
                }`}
              >
                {answerLabel}
              </span>
            </div>
            {answered.length === 0 ? (
              <p className="text-slate-500 text-xs px-4 pb-3">No one answered the bonus.</p>
            ) : (
              <div className="divide-y divide-sky-500/10">
                {answered.map((p) => {
                  const won = resulted && answer !== null && answer >= 0 && p.trivia_guess === answer;
                  return (
                    <div key={p.player_id} className="flex items-center gap-3 px-4 py-2.5">
                      <PlayerAvatar photo={p.player_photo} name={p.player_name} size={7} />
                      <span className="text-white text-sm font-medium flex-1 min-w-0 truncate">
                        {p.player_name}
                      </span>
                      <span className="text-xs text-slate-300">
                        {options[p.trivia_guess as number] ?? '—'}
                      </span>
                      {won && <PointsBadge points={1} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Active / Locked match card ───────────────────────────────────────────────

function ActiveMatchCard({
  match,
  selectedPlayer,
  onPredicted,
  bankerMode,
  bankerUsedToday,
}: {
  match: Match;
  selectedPlayer: number | null;
  onPredicted: () => void;
  // 'admin' — banker only on the designated match; 'user' — any match, one/day.
  bankerMode: 'admin' | 'user';
  // User mode only: the player already bankered another game this game day.
  bankerUsedToday: boolean;
}) {
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  // Knockout-specific prediction state
  const [predictedHomeGoals, setPredictedHomeGoals] = useState<number | null>(null);
  const [predictedAwayGoals, setPredictedAwayGoals] = useState<number | null>(null);
  const [predictedWinner, setPredictedWinner] = useState<'home' | 'away' | null>(null);
  const [banker, setBanker] = useState(false);
  const [triviaGuess, setTriviaGuess] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(
    match.status === 'locked' || new Date(match.kickoff_time) <= new Date()
  );

  const triviaOptions = parseTriviaOptions(match.trivia_options);
  const hasTrivia = !!match.trivia_question && triviaOptions.length >= 2;

  // The selected player's existing prediction for this match, if any.
  const myPrediction = selectedPlayer
    ? match.predictions.find((p) => p.player_id === selectedPlayer)
    : undefined;

  useEffect(() => {
    if (!selectedPlayer) {
      setSelectedPrediction(null);
      setPredictedHomeGoals(null);
      setPredictedAwayGoals(null);
      setPredictedWinner(null);
      setSubmitted(false);
      setBanker(false);
      setTriviaGuess(null);
      return;
    }
    const existing = match.predictions.find((p) => p.player_id === selectedPlayer);
    if (existing) {
      if (match.is_knockout) {
        setPredictedHomeGoals(existing.predicted_home_goals ?? null);
        setPredictedAwayGoals(existing.predicted_away_goals ?? null);
        setPredictedWinner((existing.predicted_winner ?? null) as 'home' | 'away' | null);
      } else {
        setSelectedPrediction(existing.prediction);
      }
      setBanker(existing.is_banker);
      setTriviaGuess(existing.trivia_guess);
      setSubmitted(true);
    } else {
      setSelectedPrediction(null);
      setPredictedHomeGoals(null);
      setPredictedAwayGoals(null);
      setPredictedWinner(null);
      setSubmitted(false);
      setBanker(false);
      setTriviaGuess(null);
    }
  }, [selectedPlayer, match.predictions, match.is_knockout]);

  const handleHomeGoalsChange = (newVal: number) => {
    const clamped = Math.max(0, Math.min(15, newVal));
    setPredictedHomeGoals(clamped);
    if (predictedAwayGoals !== null) {
      if (clamped > predictedAwayGoals) setPredictedWinner('home');
      else if (clamped < predictedAwayGoals) setPredictedWinner('away');
      else setPredictedWinner(null);
    }
  };

  const handleAwayGoalsChange = (newVal: number) => {
    const clamped = Math.max(0, Math.min(15, newVal));
    setPredictedAwayGoals(clamped);
    if (predictedHomeGoals !== null) {
      if (predictedHomeGoals > clamped) setPredictedWinner('home');
      else if (predictedHomeGoals < clamped) setPredictedWinner('away');
      else setPredictedWinner(null);
    }
  };

  const handleSubmit = async () => {
    if (match.is_knockout) {
      if (predictedHomeGoals === null || predictedAwayGoals === null || !predictedWinner) return;
    } else {
      if (!selectedPlayer || !selectedPrediction) return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = match.is_knockout
        ? {
            match_id: match.id,
            player_id: selectedPlayer,
            predicted_home_goals: predictedHomeGoals,
            predicted_away_goals: predictedAwayGoals,
            predicted_winner: predictedWinner,
            is_banker: bankerMode === 'admin' && match.is_banker_match ? true : banker,
            trivia_guess: hasTrivia ? triviaGuess : null,
          }
        : {
            match_id: match.id,
            player_id: selectedPlayer,
            prediction: selectedPrediction,
            is_banker: bankerMode === 'admin' && match.is_banker_match ? true : banker,
            trivia_guess: hasTrivia ? triviaGuess : null,
          };
      const res = await fetch('/.netlify/functions/submitPrediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitted(true);
      onPredicted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const hasLiveScore =
    match.live_home_goals !== null && match.live_away_goals !== null;

  return (
    <div
      className={`bg-slate-800 border rounded-2xl overflow-hidden shadow-xl ${
        hasLiveScore ? 'border-amber-500/40' : 'border-slate-700/60'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700/40 to-slate-800/40 px-5 py-3 flex items-center justify-between border-b border-slate-700/50">
        <span
          className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
            match.status === 'locked'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          {match.status === 'locked' ? 'Locked' : 'Open'}
        </span>
        <Countdown kickoff={match.kickoff_time} onLock={() => setIsLocked(true)} />
      </div>

      {/* Banker match badge — admin designated this as the day's banker (admin mode only) */}
      {bankerMode === 'admin' && match.is_banker_match && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide">
          <Star size={13} className="fill-amber-400 text-amber-400" />
          BANKER MATCH · 2× points if correct · {match.is_knockout ? '−2' : '−1'} if wrong
        </div>
      )}

      {/* Live score banner */}
      <LiveScoreBanner match={match} />

      {/* Teams */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col items-center gap-3">
            <FlagImg src={match.home_flag} alt={match.home_team} />
            <span className="text-white font-bold text-center text-sm leading-tight">
              {match.home_team}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-slate-500 font-black text-xl">VS</span>
            <span className="text-xs text-slate-500">
              {new Date(match.kickoff_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="text-xs text-slate-600">
              {new Date(match.kickoff_time).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-3">
            <FlagImg src={match.away_flag} alt={match.away_team} />
            <span className="text-white font-bold text-center text-sm leading-tight">
              {match.away_team}
            </span>
          </div>
        </div>
      </div>

      {/* Prediction form — open matches only, and only until a pick is locked in */}
      {!isLocked && selectedPlayer && submitted && (
        <div className="px-6 pb-6 border-t border-slate-700/50 pt-4">
          <div className="rounded-xl bg-green-600/10 border border-green-500/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-green-300 text-sm font-semibold flex items-center gap-1.5 flex-wrap">
                  Your prediction:{' '}
                  {match.is_knockout ? (
                    <span className="text-white">
                      {match.home_team} {myPrediction?.predicted_home_goals ?? '?'}–{myPrediction?.predicted_away_goals ?? '?'} {match.away_team}
                      {' · '}
                      {myPrediction?.predicted_winner === 'home' ? match.home_team : match.away_team} to advance
                    </span>
                  ) : (
                    <span className="text-white">
                      {selectedPrediction === 'home'
                        ? match.home_team
                        : selectedPrediction === 'away'
                          ? match.away_team
                          : 'Draw'}
                    </span>
                  )}
                  {myPrediction?.is_banker && (
                    <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full text-xs font-bold">
                      <BankerStar size={11} /> Banker
                    </span>
                  )}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  You can change your pick until kickoff.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setError(null);
              }}
              className="mt-3 w-full py-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Change pick
            </button>
          </div>
        </div>
      )}

      {!isLocked && selectedPlayer && !submitted && (
        <div className="px-6 pb-6 space-y-3 border-t border-slate-700/50 pt-4">
          {match.is_knockout ? (
            // ── Knockout: scoreline + winner ──────────────────────────────
            <div className="space-y-3">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider text-center">Predict the score</p>
              <div className="flex items-end">
                {/* Home goals */}
                <div className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-medium text-center truncate w-full">{match.home_team}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleHomeGoalsChange((predictedHomeGoals ?? 0) - 1)} className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl flex items-center justify-center border border-slate-600 transition-colors">−</button>
                    <span className={`font-black text-3xl w-8 text-center tabular-nums select-none ${predictedHomeGoals !== null ? 'text-white' : 'text-slate-600'}`}>{predictedHomeGoals ?? 0}</span>
                    <button type="button" onClick={() => handleHomeGoalsChange((predictedHomeGoals ?? -1) + 1)} className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl flex items-center justify-center border border-slate-600 transition-colors">+</button>
                  </div>
                </div>
                {/* Divider */}
                <div className="w-px bg-slate-700 self-stretch mx-3" />
                {/* Away goals */}
                <div className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-medium text-center truncate w-full">{match.away_team}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleAwayGoalsChange((predictedAwayGoals ?? 0) - 1)} className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl flex items-center justify-center border border-slate-600 transition-colors">−</button>
                    <span className={`font-black text-3xl w-8 text-center tabular-nums select-none ${predictedAwayGoals !== null ? 'text-white' : 'text-slate-600'}`}>{predictedAwayGoals ?? 0}</span>
                    <button type="button" onClick={() => handleAwayGoalsChange((predictedAwayGoals ?? -1) + 1)} className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl flex items-center justify-center border border-slate-600 transition-colors">+</button>
                  </div>
                </div>
              </div>
              {/* Winner — auto-locked for non-equal score, required picker for equal (pens) */}
              {predictedHomeGoals !== null && predictedAwayGoals !== null && (
                predictedHomeGoals !== predictedAwayGoals ? (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-700/40 border border-slate-600/50 px-4 py-2.5">
                    <CheckCircle2 size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">
                      Advances: <span className="text-white font-semibold">{predictedWinner === 'home' ? match.home_team : match.away_team}</span>
                    </span>
                    <span className="ml-auto text-slate-600 text-xs">auto</span>
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 space-y-2">
                    <p className="text-amber-300 text-xs font-bold uppercase tracking-wider">Who advances on penalties?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['home', 'away'] as const).map((side) => (
                        <button
                          key={side}
                          type="button"
                          onClick={() => setPredictedWinner(side)}
                          className={`py-2 px-3 rounded-xl text-sm font-bold border transition-colors ${
                            predictedWinner === side
                              ? 'bg-amber-500/25 border-amber-400/60 text-amber-100'
                              : 'bg-slate-700/60 border-slate-600/50 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {side === 'home' ? match.home_team : match.away_team}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            // ── Group stage: 3-button pick ─────────────────────────────────
            <div className="grid grid-cols-3 gap-2">
              {(['home', 'draw', 'away'] as const).map((val) => {
                const label =
                  val === 'home' ? match.home_team : val === 'away' ? match.away_team : 'Draw';
                const isSelected = selectedPrediction === val;
                return (
                  <button
                    key={val}
                    onClick={() => setSelectedPrediction(val)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                      isSelected
                        ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-600/30'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Banker toggle. Admin mode: only the designated match. User mode: any
             match, but locked out if the player already bankered another game
             on the same game day (one per game day). Shown as soon as the form is
             open so the choice is always visible; default is off. */}
          {bankerMode === 'admin' && match.is_banker_match ? (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5">
              <Star size={14} className="flex-shrink-0 text-amber-400 fill-amber-400" />
              <span className="text-amber-300 text-xs font-semibold">
                Banker is ON for everyone on this match · {match.is_knockout ? '−2' : '−1'} if wrong
              </span>
            </div>
          ) : bankerMode === 'user' ? (
            bankerUsedToday ? (
              <div className="flex items-center gap-2 rounded-xl bg-slate-700/30 border border-slate-600/40 px-4 py-2.5 text-slate-400 text-xs">
                <Star size={14} className="flex-shrink-0 text-slate-500" />
                Banker already used for another game this game day — one per game day.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBanker((b) => !b)}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border text-left transition-colors ${
                  banker
                    ? 'bg-amber-500/15 border-amber-500/50'
                    : 'bg-slate-700/40 border-slate-600/50 hover:border-slate-500'
                }`}
              >
                <Star
                  size={18}
                  className={`flex-shrink-0 ${banker ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm font-bold ${banker ? 'text-amber-200' : 'text-slate-200'}`}
                  >
                    Use my Banker
                  </span>
                  <span className="block text-xs text-slate-400 mt-0.5">
                    2× points if right · {match.is_knockout ? '−2' : '−1'} if wrong · one per game day
                  </span>
                </span>
                <span
                  className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors relative ${
                    banker ? 'bg-amber-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                      banker ? 'left-[1.125rem]' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
            )
          ) : null}

          {/* Bonus trivia — optional multiple-choice question for this match */}
          {hasTrivia && (
            <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb size={15} className="text-sky-400 flex-shrink-0" />
                <span className="text-sky-300 text-xs font-bold uppercase tracking-wider">
                  Bonus +1
                </span>
                <span className="text-slate-500 text-xs">· optional</span>
              </div>
              <p className="text-white text-sm font-medium mb-2.5">{match.trivia_question}</p>
              <div className="flex flex-wrap gap-2">
                {triviaOptions.map((opt, i) => {
                  const chosen = triviaGuess === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTriviaGuess((g) => (g === i ? null : i))}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        chosen
                          ? 'bg-sky-500/25 border-sky-400/60 text-sky-100'
                          : 'bg-slate-700/40 border-slate-600/50 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <p className="text-slate-500 text-[11px] mt-2">
                {triviaGuess === null ? 'Tap an option to guess — or skip it.' : 'Tap again to clear.'}
              </p>
            </div>
          )}

          {(match.is_knockout
            ? predictedHomeGoals !== null && predictedAwayGoals !== null && predictedWinner !== null
            : !!selectedPrediction) && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {submitting ? 'Saving...' : myPrediction ? 'Save changes' : 'Submit Prediction'}
            </button>
          )}
          {myPrediction && (
            <button
              type="button"
              onClick={() => {
                if (match.is_knockout) {
                  setPredictedHomeGoals(myPrediction.predicted_home_goals ?? null);
                  setPredictedAwayGoals(myPrediction.predicted_away_goals ?? null);
                  setPredictedWinner((myPrediction.predicted_winner ?? null) as 'home' | 'away' | null);
                } else {
                  setSelectedPrediction(myPrediction.prediction);
                }
                setBanker(myPrediction.is_banker);
                setTriviaGuess(myPrediction.trivia_guess);
                setSubmitted(true);
                setError(null);
              }}
              className="w-full py-2.5 bg-slate-700/60 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors text-sm"
            >
              Cancel
            </button>
          )}
          <p className="text-slate-500 text-xs text-center">
            You can change your pick until kickoff.
          </p>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>
      )}

      {!isLocked && !selectedPlayer && (
        <div className="px-6 pb-5 border-t border-slate-700/50 pt-4">
          <p className="text-slate-500 text-sm">Select your name above to predict this match.</p>
        </div>
      )}

      {isLocked && (
        <div className="px-6 pb-5 border-t border-slate-700/50 pt-4">
          <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
            <AlertCircle size={16} /> Predictions locked. Match has kicked off.
          </div>
        </div>
      )}

      {/* Bankers + bonus + predictions list — visible after lock */}
      {isLocked && <BankersSummary match={match} />}
      {isLocked && <TriviaSummary match={match} />}
      {isLocked && (
        <PredictionsList predictions={match.predictions} match={match} defaultOpen={false} />
      )}
    </div>
  );
}

// ─── Completed match card ─────────────────────────────────────────────────────

function CompletedMatchCard({ match }: { match: Match }) {
  const homeGoals = match.final_home_goals;
  const awayGoals = match.final_away_goals;
  const hasScore = homeGoals !== null && awayGoals !== null;

  const resultLabel =
    match.result === 'home'
      ? match.home_team
      : match.result === 'away'
        ? match.away_team
        : 'Draw';

  const resultColor =
    match.result === 'draw' ? 'text-amber-400' : 'text-green-400';

  return (
    <div className="bg-slate-800/70 border border-slate-700/40 rounded-2xl overflow-hidden">
      {/* Compact result row */}
      <div className="px-5 py-4 flex items-center gap-3">
        {/* Home */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FlagImg src={match.home_flag} alt={match.home_team} size="sm" />
          <span
            className={`text-sm font-semibold truncate ${
              match.result === 'home' ? 'text-white' : 'text-slate-400'
            }`}
          >
            {match.home_team}
          </span>
        </div>

        {/* Score / result */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-2">
          {hasScore ? (
            <span className="text-white font-black text-xl tabular-nums leading-none">
              {homeGoals}
              <span className="text-slate-500 mx-1 font-light text-lg">–</span>
              {awayGoals}
            </span>
          ) : (
            <span className="text-slate-500 font-black text-sm">FT</span>
          )}
          <span className={`text-xs font-bold ${resultColor}`}>
            {match.result === 'draw' ? 'Draw' : `${resultLabel} win`}
          </span>
        </div>

        {/* Away */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span
            className={`text-sm font-semibold truncate ${
              match.result === 'away' ? 'text-white' : 'text-slate-400'
            }`}
          >
            {match.away_team}
          </span>
          <FlagImg src={match.away_flag} alt={match.away_team} size="sm" />
        </div>
      </div>

      {/* Date strip */}
      <div className="px-5 pb-3 -mt-1">
        <span className="text-slate-600 text-xs">
          {new Date(match.kickoff_time).toLocaleDateString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Bankers + bonus summaries */}
      <BankersSummary match={match} />
      <TriviaSummary match={match} />

      {/* Predictions — collapsed by default */}
      <PredictionsList predictions={match.predictions} match={match} defaultOpen={false} />
    </div>
  );
}

// ─── Completed matches, grouped & collapsed by kickoff day ─────────────────────

function CompletedDayGroup({
  day,
  matches,
  defaultOpen = false,
}: {
  day: string;
  matches: Match[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl bg-slate-800/40 border border-slate-700/40 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/60 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">{formatDayLabel(day)}</span>
          <span className="text-slate-500 text-xs">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </span>
        </span>
        {open ? (
          <ChevronUp size={16} className="text-slate-500" />
        ) : (
          <ChevronDown size={16} className="text-slate-500" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3">
          {matches.map((m) => (
            <CompletedMatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Perfect Predictors (trivia of the day) ───────────────────────────────────

// "YYYY-MM-DD" is a Official game day (US Eastern) calendar date. Parse the parts directly so the
// label doesn't drift by a day in the viewer's own timezone.
function formatDayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Compact "Mon D" label for chart axes.
function formatDayShort(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function PerfectDayRow({ day, defaultOpen = false }: { day: PerfectDay; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/40 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">{formatDayLabel(day.day)}</span>
          <span className="text-slate-500 text-xs">
            {day.perfect_players.length} perfect
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-amber-300 text-xs font-bold bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
            <Flame size={11} />
            {day.game_count}/{day.game_count} games
          </span>
          {open ? (
            <ChevronUp size={14} className="text-slate-500" />
          ) : (
            <ChevronDown size={14} className="text-slate-500" />
          )}
        </span>
      </button>

      {open && (
        <div className="divide-y divide-slate-700/40 border-t border-slate-700/40">
          {day.perfect_players.map((pl) => (
            <div key={pl.player_id} className="flex items-center gap-3 px-4 py-2.5">
              <PlayerAvatar photo={pl.player_photo} name={pl.player_name} size={7} />
              <span className="text-white text-sm font-medium flex-1">{pl.player_name}</span>
              <span className="text-amber-300 text-base" title="Perfect day">
                🔥
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PerfectDaysCard({ days }: { days: PerfectDay[] }) {
  const [open, setOpen] = useState(false);

  if (days.length === 0) return null;

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-500/20 rounded-2xl overflow-hidden shadow-xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-5 py-4 border-b border-slate-700/40 bg-gradient-to-r from-amber-950/40 to-slate-800"
      >
        <Flame size={18} className="text-amber-400" />
        <h3 className="text-white font-bold tracking-wide">Perfect Predictors</h3>
        {open ? (
          <ChevronUp size={14} className="text-slate-500 ml-auto" />
        ) : (
          <ChevronDown size={14} className="text-slate-500 ml-auto" />
        )}
      </button>

      {open && (
        <>
          <p className="text-slate-400 text-xs px-5 pt-3">
            Players who called <span className="text-amber-300 font-semibold">every</span> game right
            on a full match day.
          </p>

          <div className="px-4 py-4 space-y-3">
            {days.map((d) => (
              <PerfectDayRow key={d.day} day={d} defaultOpen={false} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Banker mode banner ───────────────────────────────────────────────────────

// Big, eye-catching banner telling players how the Banker works today.
function BankerModeBanner({ mode }: { mode: 'admin' | 'user' }) {
  if (mode === 'user') {
    return (
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-500/25 via-emerald-400/10 to-emerald-500/25 shadow-lg shadow-emerald-500/15">
        <div className="absolute inset-0 pointer-events-none bg-emerald-400/10 animate-pulse" />
        <div className="relative flex items-center gap-3 px-5 py-3.5">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/25 border border-emerald-400/50 text-2xl flex-shrink-0">
            ⭐
          </span>
          <div className="min-w-0">
            <p className="text-emerald-300 font-black text-sm uppercase tracking-wider flex flex-wrap items-center gap-2">
              Your Banker, Your Call
              <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-100 px-2 py-0.5 rounded-full normal-case tracking-normal">
                Players pick
              </span>
            </p>
            <p className="text-slate-200 text-xs mt-1 leading-snug">
              Bank <span className="text-white font-semibold">any one match per game day</span> — 2× points
              if right, −2 if wrong. Game days follow the official schedule (US Eastern).
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/60 bg-gradient-to-r from-amber-500/25 via-amber-400/10 to-amber-500/25 shadow-lg shadow-amber-500/15">
      <div className="absolute inset-0 pointer-events-none bg-amber-400/10 animate-pulse" />
      <div className="relative flex items-center gap-3 px-5 py-3.5">
        <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/25 border border-amber-400/50 text-2xl flex-shrink-0">
          🏦
        </span>
        <div className="min-w-0">
          <p className="text-amber-300 font-black text-sm uppercase tracking-wider flex flex-wrap items-center gap-2">
            Banker Match Mode
            <span className="text-[10px] font-bold bg-amber-500/30 text-amber-100 px-2 py-0.5 rounded-full normal-case tracking-normal">
              Admin picks
            </span>
          </p>
          <p className="text-slate-200 text-xs mt-1 leading-snug">
            The admin marks <span className="text-white font-semibold">one Banker match</span> each day —
            bank it for 2×, or −2 if it flops.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Standings Tracker (rank/points over matchdays) ───────────────────────────

type StdDayPoint = { total: number; rank: number };
type StdSeries = {
  id: number;
  name: string;
  photo?: string;
  points: StdDayPoint[];
  finalTotal: number;
  finalRank: number;
};

// Reconstruct each player's cumulative total and rank after every completed
// matchday — built entirely from the predictions already loaded (points +
// trivia_points), ordered by kickoff. No backend needed.
function buildStandingsHistory(matches: Match[]): { days: string[]; series: StdSeries[] } {
  const completed = matches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());

  const roster = new Map<number, { name: string; photo?: string }>();
  for (const m of completed)
    for (const p of m.predictions)
      if (!roster.has(p.player_id))
        roster.set(p.player_id, { name: p.player_name, photo: p.player_photo });

  const dayOrder: string[] = [];
  const byDay = new Map<string, Match[]>();
  for (const m of completed) {
    const d = gameDay(m.kickoff_time);
    if (!byDay.has(d)) {
      byDay.set(d, []);
      dayOrder.push(d);
    }
    byDay.get(d)!.push(m);
  }

  const totals = new Map<number, number>();
  const corrects = new Map<number, number>();
  const seriesPts = new Map<number, StdDayPoint[]>();
  for (const id of roster.keys()) {
    totals.set(id, 0);
    corrects.set(id, 0);
    seriesPts.set(id, []);
  }

  for (const day of dayOrder) {
    for (const m of byDay.get(day)!)
      for (const p of m.predictions) {
        if (!totals.has(p.player_id)) continue;
        totals.set(
          p.player_id,
          totals.get(p.player_id)! + (p.points || 0) + (p.score_points || 0) + (p.trivia_points || 0)
        );
        // Match the leaderboard's "correct" definition: a match pick worth > 0
        // (trivia points don't count toward correctness).
        if ((p.points || 0) > 0) corrects.set(p.player_id, corrects.get(p.player_id)! + 1);
      }
    // Same ordering as getWcLeaderboard: total desc, correct desc, name asc.
    const ranked = [...roster.keys()].sort((a, b) => {
      const dt = totals.get(b)! - totals.get(a)!;
      if (dt !== 0) return dt;
      const dc = corrects.get(b)! - corrects.get(a)!;
      if (dc !== 0) return dc;
      return roster.get(a)!.name.localeCompare(roster.get(b)!.name);
    });
    ranked.forEach((id, idx) => seriesPts.get(id)!.push({ total: totals.get(id)!, rank: idx + 1 }));
  }

  const series: StdSeries[] = [...roster.entries()].map(([id, info]) => {
    const pts = seriesPts.get(id)!;
    const last = pts[pts.length - 1];
    return {
      id,
      name: info.name,
      photo: info.photo,
      points: pts,
      finalTotal: last?.total ?? 0,
      finalRank: last?.rank ?? roster.size,
    };
  });

  return { days: dayOrder, series };
}

function StandingsTracker({
  matches,
  selectedPlayer,
}: {
  matches: Match[];
  selectedPlayer: number | null;
}) {
  const [open, setOpen] = useState(true);
  const [view, setView] = useState<'rank' | 'points'>('rank');
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const { days, series } = useMemo(() => buildStandingsHistory(matches), [matches]);

  // Follow the predict-page name dropdown: picking your name lights up your line
  // automatically. The chart's own selector can still override for exploration.
  useEffect(() => {
    if (selectedPlayer) setHighlightId(selectedPlayer);
  }, [selectedPlayer]);

  // Needs at least two matchdays and two players to tell a story.
  if (days.length < 2 || series.length < 2) return null;

  const N = series.length;
  const byRank = [...series].sort((a, b) => a.finalRank - b.finalRank);
  const leaderId = byRank[0].id;
  const top3 = byRank.slice(0, 3).map((s) => s.id);
  const medal = ['#fbbf24', '#cbd5e1', '#fb923c'];

  const highlight =
    highlightId !== null && series.some((s) => s.id === highlightId)
      ? highlightId
      : selectedPlayer && series.some((s) => s.id === selectedPlayer)
        ? selectedPlayer
        : leaderId;
  const hSeries = series.find((s) => s.id === highlight)!;
  const hFirst = hSeries.points[0];
  const hLast = hSeries.points[hSeries.points.length - 1];

  // Geometry
  const VBW = 680;
  const VBH = 280;
  const padL = 32;
  const padR = 80;
  const padT = 16;
  const padB = 30;
  const innerW = VBW - padL - padR;
  const innerH = VBH - padT - padB;
  const xFor = (i: number) =>
    padL + (days.length === 1 ? innerW / 2 : (i * innerW) / (days.length - 1));

  let minT = Infinity;
  let maxT = -Infinity;
  for (const s of series)
    for (const dp of s.points) {
      if (dp.total < minT) minT = dp.total;
      if (dp.total > maxT) maxT = dp.total;
    }
  if (minT === maxT) {
    minT -= 1;
    maxT += 1;
  }

  const yFor = (dp: StdDayPoint) =>
    view === 'rank'
      ? padT + (N === 1 ? innerH / 2 : ((dp.rank - 1) * innerH) / (N - 1))
      : padT + innerH * (1 - (dp.total - minT) / (maxT - minT));

  const pathFor = (s: StdSeries) => s.points.map((dp, i) => `${xFor(i)},${yFor(dp)}`).join(' ');
  const labelStep = Math.max(1, Math.ceil(days.length / 7));

  // Y-axis reference ticks (with gridlines).
  const yTicks: { y: number; label: string }[] = [];
  if (view === 'rank') {
    const step = N <= 6 ? 1 : N <= 12 ? 2 : N <= 25 ? 5 : 10;
    const ranks = new Set<number>([1, N]);
    for (let r = step; r < N; r += step) ranks.add(r);
    [...ranks]
      .sort((a, b) => a - b)
      .forEach((r) =>
        yTicks.push({
          y: padT + (N === 1 ? innerH / 2 : ((r - 1) * innerH) / (N - 1)),
          label: r === 1 ? '1st' : `#${r}`,
        })
      );
  } else {
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const val = Math.round(maxT - (i * (maxT - minT)) / steps);
      yTicks.push({
        y: padT + innerH * (1 - (val - minT) / (maxT - minT)),
        label: String(val),
      });
    }
  }

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-5 py-4 border-b border-slate-700/40 bg-gradient-to-r from-slate-800 to-sky-950/40"
      >
        <TrendingUp size={18} className="text-sky-400" />
        <h3 className="text-white font-bold tracking-wide">Standings Tracker</h3>
        {open ? (
          <ChevronUp size={14} className="text-slate-500 ml-auto" />
        ) : (
          <ChevronDown size={14} className="text-slate-500 ml-auto" />
        )}
      </button>

      {open && (
        <div className="p-4 space-y-3">
          {/* Controls */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex rounded-xl bg-slate-700/40 border border-slate-600/40 p-0.5">
              {(['rank', 'points'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    view === v ? 'bg-sky-500/30 text-sky-100' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {v === 'rank' ? 'Positions' : 'Points'}
                </button>
              ))}
            </div>
            <select
              value={String(highlight)}
              onChange={(e) => setHighlightId(Number(e.target.value))}
              className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg px-2 py-1.5 max-w-[55%] focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {byRank.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  #{s.finalRank} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Highlighted player's journey */}
          <p className="text-xs text-slate-400">
            <span className="text-sky-300 font-semibold">{hSeries.name}</span>{' '}
            {view === 'rank' ? (
              <>
                moved from <span className="text-white font-bold">#{hFirst.rank}</span> to{' '}
                <span className="text-white font-bold">#{hLast.rank}</span>
              </>
            ) : (
              <>
                from <span className="text-white font-bold">{hFirst.total}</span> to{' '}
                <span className="text-white font-bold">{hLast.total}</span> pts
              </>
            )}
          </p>

          {/* Chart */}
          <svg viewBox={`0 0 ${VBW} ${VBH}`} className="w-full">
            {/* Y reference gridlines + labels */}
            {yTicks.map((t, i) => (
              <g key={`tick-${i}`}>
                <line
                  x1={padL}
                  y1={t.y}
                  x2={padL + innerW}
                  y2={t.y}
                  stroke="#334155"
                  strokeOpacity={0.45}
                  strokeWidth={1}
                />
                <text x={padL - 6} y={t.y + 3} fontSize={9} fill="#64748b" textAnchor="end">
                  {t.label}
                </text>
              </g>
            ))}

            {/* Faint pack */}
            {series
              .filter((s) => s.id !== highlight && !top3.includes(s.id))
              .map((s) => (
                <polyline
                  key={s.id}
                  points={pathFor(s)}
                  fill="none"
                  stroke="#64748b"
                  strokeOpacity={0.16}
                  strokeWidth={1}
                />
              ))}
            {/* Top 3 tinted */}
            {top3
              .filter((id) => id !== highlight)
              .map((id) => {
                const s = series.find((x) => x.id === id)!;
                const ci = byRank.findIndex((x) => x.id === id);
                return (
                  <polyline
                    key={id}
                    points={pathFor(s)}
                    fill="none"
                    stroke={medal[ci]}
                    strokeOpacity={0.5}
                    strokeWidth={1.5}
                  />
                );
              })}
            {/* Highlighted player */}
            <polyline points={pathFor(hSeries)} fill="none" stroke="#38bdf8" strokeWidth={2.5} />
            {hSeries.points.map((dp, i) => (
              <circle key={i} cx={xFor(i)} cy={yFor(dp)} r={2.5} fill="#38bdf8" />
            ))}
            <circle cx={xFor(days.length - 1)} cy={yFor(hLast)} r={4} fill="#38bdf8" />
            <text
              x={xFor(days.length - 1) + 8}
              y={yFor(hLast) + 4}
              fontSize={12}
              fontWeight={700}
              fill="#e0f2fe"
            >
              {hSeries.name.split(' ')[0]}
            </text>

            {/* X labels */}
            {days.map((d, i) =>
              i % labelStep === 0 || i === days.length - 1 ? (
                <text
                  key={d}
                  x={xFor(i)}
                  y={VBH - 10}
                  fontSize={10}
                  fill="#64748b"
                  textAnchor="middle"
                >
                  {formatDayShort(d)}
                </text>
              ) : null
            )}

          </svg>

          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 inline-block bg-sky-400" /> You / selected
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 inline-block" style={{ background: '#fbbf24' }} /> Top 3
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 inline-block bg-slate-500/50" /> Others
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const WcPredict: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [bankerMode, setBankerMode] = useState<'admin' | 'user'>('admin');
  const [players, setPlayers] = useState<Player[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [perfectDays, setPerfectDays] = useState<PerfectDay[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [showChasers, setShowChasers] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Force the latest deployed code, then reload (which also re-fetches all data).
  // Friends keep the PWA open and miss new features after a deploy because the
  // service worker serves cached code — this checks for a new SW, activates it,
  // and reloads so they're guaranteed to get the newest version.
  const hardRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } catch {
      // Ignore — fall through to a plain reload regardless.
    } finally {
      window.location.reload();
    }
  }, []);

  const shareLeaderboard = useCallback(async () => {
    const top = leaderboard.slice(0, 8);
    if (top.length === 0) return;
    setSharing(true);
    try {
      // Preload the club logo (same-origin, so it won't taint the canvas) and all
      // player photos in parallel. Any failure falls back to emoji/initials.
      const loadImage = (src: string, crossOrigin?: boolean) =>
        new Promise<HTMLImageElement | null>((resolve) => {
          const image = new Image();
          let done = false;
          const finish = (result: HTMLImageElement | null) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            resolve(result);
          };
          // The same photo URLs are rendered elsewhere as plain <img> (no CORS),
          // so the browser may have a cached "no-CORS" response. Reusing it for a
          // crossOrigin load fails (missing Access-Control-Allow-Origin) and taints
          // the canvas. Append a cache-buster so the crossOrigin fetch is a distinct
          // cache entry that actually carries the CORS headers.
          if (crossOrigin) {
            image.crossOrigin = 'anonymous';
            src += (src.includes('?') ? '&' : '?') + 'cors=1';
          }
          // Don't let a slow/hanging photo block the whole share.
          const timer = setTimeout(() => finish(null), 8000);
          image.onload = () => finish(image);
          image.onerror = () => finish(null);
          image.src = src;
        });

      const [logo, photos] = await Promise.all([
        loadImage('/icons/icon-512x512.png'),
        Promise.all(
          top.map((e) =>
            e.player_photo
              ? loadImage(e.player_photo, true)
              : Promise.resolve<HTMLImageElement | null>(null)
          )
        ),
      ]);

      const DPR = 2;
      const W = 440;
      const HEADER_H = 138;
      const ROW_H = 78;
      const FOOTER_H = 50;
      const H = HEADER_H + top.length * ROW_H + FOOTER_H;

      const canvas = document.createElement('canvas');
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(DPR, DPR);

      const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0b1220');
      bg.addColorStop(0.5, '#0f1b2e');
      bg.addColorStop(1, '#0b1220');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Header glow
      const glow = ctx.createRadialGradient(W / 2, 24, 8, W / 2, 24, 200);
      glow.addColorStop(0, 'rgba(251,191,36,0.20)');
      glow.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, HEADER_H);

      // Top accent stripe (green → gold → green)
      const stripe = ctx.createLinearGradient(0, 0, W, 0);
      stripe.addColorStop(0, '#16a34a');
      stripe.addColorStop(0.5, '#fbbf24');
      stripe.addColorStop(1, '#16a34a');
      ctx.fillStyle = stripe;
      ctx.fillRect(0, 0, W, 5);

      // Header — club logo (circular) with trophy-emoji fallback
      ctx.textAlign = 'center';
      if (logo) {
        const lx = W / 2;
        const ly = 40;
        const lr = 27;
        ctx.save();
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const s = Math.max((lr * 2) / logo.width, (lr * 2) / logo.height);
        const dw = logo.width * s;
        const dh = logo.height * s;
        ctx.drawImage(logo, lx - dw / 2, ly - dh / 2, dw, dh);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(251,191,36,0.6)';
        ctx.stroke();
      } else {
        ctx.font = '34px serif';
        ctx.fillText('🏆', W / 2, 56);
      }

      ctx.fillStyle = '#fbbf24';
      ctx.font = '800 23px system-ui, -apple-system, sans-serif';
      ctx.fillText('WC 2026 Leaderboard', W / 2, 92);

      ctx.fillStyle = '#7c8aa3';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillText('Cogni HFX FC · Match Predictions', W / 2, 113);

      // Per-rank palettes
      const medal = ['🥇', '🥈', '🥉'];
      const ringClr = ['#fbbf24', '#cbd5e1', '#fb923c'];
      const ptsClr = ['#fbbf24', '#e2e8f0', '#fb923c'];
      const tint = [
        'rgba(251,191,36,0.10)',
        'rgba(203,213,225,0.06)',
        'rgba(251,146,60,0.08)',
      ];

      for (let i = 0; i < top.length; i++) {
        const e = top[i];
        const rowY = HEADER_H + i * ROW_H;
        const cardX = 14;
        const cardY = rowY + 6;
        const cardW = W - 28;
        const cardH = ROW_H - 12;
        const midY = cardY + cardH / 2;

        // Card
        roundRect(cardX, cardY, cardW, cardH, 16);
        ctx.fillStyle = i < 3 ? tint[i] : 'rgba(255,255,255,0.03)';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = i < 3 ? `${ringClr[i]}55` : 'rgba(148,163,184,0.12)';
        ctx.stroke();

        // Rank badge
        const rankX = cardX + 28;
        if (i < 3) {
          ctx.font = '25px serif';
          ctx.textAlign = 'center';
          ctx.fillText(medal[i], rankX, midY + 9);
        } else {
          ctx.fillStyle = 'rgba(148,163,184,0.14)';
          roundRect(rankX - 13, midY - 13, 26, 26, 9);
          ctx.fill();
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 14px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(i + 1), rankX, midY + 5);
        }

        // Avatar
        const ax = cardX + 74;
        const ar = 25;
        if (i < 3) {
          ctx.beginPath();
          ctx.arc(ax, midY, ar + 3, 0, Math.PI * 2);
          ctx.fillStyle = ringClr[i];
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(ax, midY, ar, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        const ph = photos[i];
        if (ph) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(ax, midY, ar, 0, Math.PI * 2);
          ctx.clip();
          // cover-fit
          const s = Math.max((ar * 2) / ph.width, (ar * 2) / ph.height);
          const dw = ph.width * s;
          const dh = ph.height * s;
          ctx.drawImage(ph, ax - dw / 2, midY - dh / 2, dw, dh);
          ctx.restore();
        } else {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = 'bold 19px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(e.player_name.charAt(0).toUpperCase(), ax, midY + 6);
        }

        // Name + record
        const nameX = cardX + 110;
        const maxNameW = cardW - 110 - 74;
        ctx.textAlign = 'left';
        ctx.fillStyle = i < 3 ? '#ffffff' : '#e2e8f0';
        ctx.font = `${i === 0 ? '800 17px' : '700 15px'} system-ui, sans-serif`;
        let displayName = e.player_name;
        while (ctx.measureText(displayName).width > maxNameW && displayName.length > 3)
          displayName = displayName.slice(0, -1);
        if (displayName !== e.player_name) displayName += '…';
        ctx.fillText(displayName, nameX, midY - 4);

        ctx.fillStyle = '#64748b';
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillText(
          `${e.correct_predictions}/${e.predictions_made} correct`,
          nameX,
          midY + 14
        );

        // Points
        const ptsX = cardX + cardW - 18;
        ctx.textAlign = 'right';
        ctx.fillStyle = i < 3 ? ptsClr[i] : '#e2e8f0';
        ctx.font = `800 ${i === 0 ? 27 : 22}px system-ui, sans-serif`;
        ctx.fillText(String(e.total_points), ptsX, midY + 3);
        ctx.fillStyle = '#64748b';
        ctx.font = '9px system-ui, sans-serif';
        ctx.fillText('PTS', ptsX, midY + 16);
      }

      // Footer
      const fY = HEADER_H + top.length * ROW_H;
      ctx.fillStyle = '#475569';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Cogni HFX FC · FIFA World Cup 2026', W / 2, fY + 30);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'wc-leaderboard.png', { type: 'image/png' });
        try {
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: 'WC 2026 – Cogni HFX FC Leaderboard' });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'wc-leaderboard.png';
            a.click();
            URL.revokeObjectURL(url);
          }
        } catch { /* user cancelled */ }
      }, 'image/png');
    } finally {
      setSharing(false);
    }
  }, [leaderboard]);

  const fetchAll = useCallback(async () => {
    try {
      const [matchRes, playersRes, lbRes, perfectRes] = await Promise.all([
        fetch('/.netlify/functions/getActiveWcMatch'),
        fetch('/.netlify/functions/getPlayers'),
        fetch('/.netlify/functions/getWcLeaderboard'),
        fetch('/.netlify/functions/getWcPerfectDays'),
      ]);
      const matchData = await matchRes.json();
      const playersData = await playersRes.json();
      const lbData = await lbRes.json();
      const perfectData = await perfectRes.json();
      setMatches(matchData.matches ?? []);
      setBankerMode(matchData.banker_mode === 'user' ? 'user' : 'admin');
      setPlayers(playersData);
      setLeaderboard(lbData);
      setPerfectDays(perfectData.days ?? []);
    } catch {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm tracking-widest uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  // Sort: active/locked first (by kickoff ASC), completed last (by kickoff DESC)
  const activeMatches = matches
    .filter((m) => m.status !== 'completed')
    .sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());

  const completedMatches = matches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime());

  // Group completed matches by game day (most recent day first, since
  // completedMatches is already sorted DESC).
  const completedByDay: { day: string; matches: Match[] }[] = [];
  {
    const index = new Map<string, Match[]>();
    for (const m of completedMatches) {
      const day = gameDay(m.kickoff_time);
      let arr = index.get(day);
      if (!arr) {
        arr = [];
        index.set(day, arr);
        completedByDay.push({ day, matches: arr });
      }
      arr.push(m);
    }
  }

  const hasActiveMatches = activeMatches.length > 0;

  // User mode only: which match (if any) the selected player has bankered on each
  // game day. Used to lock the toggle on that day's OTHER games (one per day),
  // while still allowing them to edit the banker on the match they chose.
  const bankerMatchByDay = new Map<string, number>();
  if (bankerMode === 'user' && selectedPlayer) {
    for (const m of matches) {
      for (const p of m.predictions) {
        if (p.player_id === selectedPlayer && p.is_banker) {
          bankerMatchByDay.set(gameDay(m.kickoff_time), m.id);
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-900 via-slate-900 to-slate-900 border-b border-slate-700/60 px-4 py-6">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-end gap-2 mb-3">
            <span className="text-amber-200/80 text-xs font-medium text-right leading-tight">
              Tap to get today&apos;s mode &amp; latest version →
            </span>
            <button
              onClick={hardRefresh}
              disabled={refreshing}
              title="Refresh — get the latest version and data"
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:from-amber-500 active:to-amber-600 text-slate-900 text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-amber-500/40 ring-1 ring-amber-300/50 transition-all disabled:opacity-60 animate-pulse hover:animate-none flex-shrink-0"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy size={22} className="text-amber-400" />
              <h1 className="text-2xl font-bold text-white tracking-tight">FIFA World Cup 2026</h1>
            </div>
            <p className="text-slate-400 text-sm">Cogni HFX FC — Match Predictor</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 pt-6 space-y-6">

        {/* Banker mode banner — tells players how the Banker works today */}
        {hasActiveMatches && <BankerModeBanner mode={bankerMode} />}

        {/* Player selector — only when there are active matches to predict */}
        {hasActiveMatches && (
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl px-5 py-4">
            <p className="text-slate-400 text-sm mb-3 font-medium">Who are you?</p>
            <div className="relative">
              <select
                value={selectedPlayer ?? ''}
                onChange={(e) => setSelectedPlayer(Number(e.target.value) || null)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="">Select your name...</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
            {selectedPlayer && (
              <p className="text-green-400 text-xs mt-2 font-medium">
                Scroll down to predict each match below.
              </p>
            )}
          </div>
        )}

        {/* Standings Tracker — your journey, right where you predict */}
        <StandingsTracker matches={matches} selectedPlayer={selectedPlayer} />

        {/* Active / locked match cards */}
        {activeMatches.length === 0 && completedMatches.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-10 text-center">
            <Trophy size={36} className="mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 font-medium">No active matches right now</p>
            <p className="text-slate-500 text-sm mt-1">Check back when matches are activated</p>
          </div>
        ) : (
          activeMatches.map((match) => (
            <ActiveMatchCard
              key={match.id}
              match={match}
              selectedPlayer={selectedPlayer}
              onPredicted={fetchAll}
              bankerMode={bankerMode}
              bankerUsedToday={
                bankerMode === 'user' &&
                bankerMatchByDay.has(gameDay(match.kickoff_time)) &&
                bankerMatchByDay.get(gameDay(match.kickoff_time)) !== match.id
              }
            />
          ))
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40 bg-gradient-to-r from-slate-800 to-green-950/40">
              <button
                onClick={() => setShowLeaderboard((s) => !s)}
                className="flex items-center gap-2 flex-1"
              >
                <Trophy size={18} className="text-amber-400" />
                <h3 className="text-white font-bold tracking-wide">Leaderboard</h3>
                {showLeaderboard
                  ? <ChevronUp size={14} className="text-slate-500 ml-1" />
                  : <ChevronDown size={14} className="text-slate-500 ml-1" />}
              </button>
              <button
                onClick={shareLeaderboard}
                disabled={sharing}
                className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600/30 active:bg-green-600/40 border border-green-500/30 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <Share2 size={13} />
                {sharing ? 'Sharing…' : 'Share'}
              </button>
            </div>

            {showLeaderboard && (
              <>
                {/* Podium — top 3 */}
                <div className="relative px-4 pt-7 pb-4 overflow-hidden">
                  {/* glow backdrop */}
                  <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />

                  <div className="relative flex items-end justify-center gap-2.5">
                    {/* 2nd place */}
                    {leaderboard[1] && (
                      <div className="flex-1 flex flex-col items-center">
                        <div className="relative mb-3">
                          <LeaderAvatar
                            photo={leaderboard[1].player_photo}
                            name={leaderboard[1].player_name}
                            px={58}
                            ringColor="#cbd5e1"
                          />
                          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-base drop-shadow">🥈</span>
                        </div>
                        <div className="w-full flex flex-col items-center rounded-2xl bg-gradient-to-b from-slate-500/25 to-slate-700/5 border border-slate-400/25 px-2 pt-3 pb-3">
                          <p className="text-slate-200 text-xs font-semibold text-center leading-tight truncate w-full px-1">
                            {leaderboard[1].player_name.split(' ')[0]}
                          </p>
                          <p className="text-white font-black text-2xl mt-1 leading-none">{leaderboard[1].total_points}</p>
                          <p className="text-slate-400 text-[10px] uppercase tracking-wider">pts</p>
                          <p className="text-slate-400 text-[11px] mt-1.5">
                            {leaderboard[1].correct_predictions}/{leaderboard[1].predictions_made} correct
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 1st place — center, elevated */}
                    {leaderboard[0] && (
                      <div className="flex-1 flex flex-col items-center -mt-5">
                        <span className="text-2xl mb-1 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">👑</span>
                        <div className="relative mb-3">
                          <LeaderAvatar
                            photo={leaderboard[0].player_photo}
                            name={leaderboard[0].player_name}
                            px={76}
                            ringColor="#fbbf24"
                            glow
                          />
                          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-lg drop-shadow">🥇</span>
                        </div>
                        <div className="w-full flex flex-col items-center rounded-2xl bg-gradient-to-b from-amber-400/25 to-amber-900/10 border-2 border-amber-400/50 px-2 pt-3 pb-3.5 shadow-lg shadow-amber-500/15">
                          <p className="text-amber-100 text-xs font-bold text-center leading-tight truncate w-full px-1">
                            {leaderboard[0].player_name.split(' ')[0]}
                          </p>
                          <p className="text-amber-300 font-black text-4xl mt-1 leading-none drop-shadow">{leaderboard[0].total_points}</p>
                          <p className="text-amber-500/80 text-[10px] uppercase tracking-wider">pts</p>
                          <p className="text-amber-200/70 text-[11px] mt-1.5">
                            {leaderboard[0].correct_predictions}/{leaderboard[0].predictions_made} correct
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 3rd place */}
                    {leaderboard[2] && (
                      <div className="flex-1 flex flex-col items-center">
                        <div className="relative mb-3">
                          <LeaderAvatar
                            photo={leaderboard[2].player_photo}
                            name={leaderboard[2].player_name}
                            px={58}
                            ringColor="#fb923c"
                          />
                          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-base drop-shadow">🥉</span>
                        </div>
                        <div className="w-full flex flex-col items-center rounded-2xl bg-gradient-to-b from-orange-500/20 to-orange-950/5 border border-orange-500/25 px-2 pt-3 pb-3">
                          <p className="text-orange-200 text-xs font-semibold text-center leading-tight truncate w-full px-1">
                            {leaderboard[2].player_name.split(' ')[0]}
                          </p>
                          <p className="text-white font-black text-2xl mt-1 leading-none">{leaderboard[2].total_points}</p>
                          <p className="text-orange-400/80 text-[10px] uppercase tracking-wider">pts</p>
                          <p className="text-orange-300/70 text-[11px] mt-1.5">
                            {leaderboard[2].correct_predictions}/{leaderboard[2].predictions_made} correct
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ranks 4+ */}
                {leaderboard.length > 3 && (
                  <div className="px-4 pb-4 pt-1">
                    <button
                      onClick={() => setShowChasers((s) => !s)}
                      className="w-full flex items-center gap-3 px-1 py-2 mb-1"
                    >
                      <div className="h-px flex-1 bg-slate-700/50" />
                      <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
                        Chasing the podium
                        <span className="text-slate-600 normal-case tracking-normal">
                          ({leaderboard.length - 3})
                        </span>
                        {showChasers ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </span>
                      <div className="h-px flex-1 bg-slate-700/50" />
                    </button>
                    {showChasers && (
                    <div className="space-y-2">
                      {leaderboard.slice(3).map((entry, idx) => (
                        <div
                          key={entry.player_id}
                          className="flex items-center gap-3 rounded-xl bg-slate-800/60 border border-slate-700/40 px-3 py-2.5 hover:border-slate-600/60 transition-colors"
                        >
                          <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700/60 text-slate-300 font-bold text-sm flex-shrink-0">
                            {idx + 4}
                          </span>
                          <LeaderAvatar photo={entry.player_photo} name={entry.player_name} px={40} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{entry.player_name}</p>
                            <p className="text-slate-500 text-[11px] mt-0.5">
                              {entry.correct_predictions}/{entry.predictions_made} correct
                            </p>
                          </div>
                          <div className="flex items-baseline gap-1 flex-shrink-0">
                            <span className="text-white font-black text-lg leading-none">{entry.total_points}</span>
                            <span className="text-slate-500 text-[10px] uppercase tracking-wide">pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Perfect Predictors — trivia of the day */}
        <PerfectDaysCard days={perfectDays} />

        {/* Completed matches — grouped by kickoff day, collapsed by default */}
        {completedMatches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700/60" />
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
                Completed
              </span>
              <div className="h-px flex-1 bg-slate-700/60" />
            </div>
            {completedByDay.map((g) => (
              <CompletedDayGroup key={g.day} day={g.day} matches={g.matches} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm px-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default WcPredict;
