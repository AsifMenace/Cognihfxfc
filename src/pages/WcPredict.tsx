import React, { useEffect, useState, useCallback } from 'react';
import {
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Share2,
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
  predictions: Prediction[];
}

interface Prediction {
  match_id: number;
  player_id: number;
  player_name: string;
  player_photo: string;
  prediction: string;
  points: number;
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

// ─── Shared helpers ──────────────────────────────────────────────────────────

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
      {points > 0 ? `+${points}` : '0'}
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
  const [activePick, setActivePick] = useState<'home' | 'draw' | 'away' | null>(null);

  if (predictions.length === 0) return null;

  const isCompleted = match.status === 'completed';
  const picks = [
    { val: 'home' as const, label: match.home_team },
    { val: 'draw' as const, label: 'Draw' },
    { val: 'away' as const, label: match.away_team },
  ];
  const votersFor = (val: 'home' | 'draw' | 'away') =>
    predictions.filter((p) => p.prediction === val);
  const activeVoters = activePick ? votersFor(activePick) : [];
  const activeLabel = picks.find((p) => p.val === activePick)?.label ?? '';

  return (
    <div className="border-t border-slate-700/50">
      {/* Vote breakdown — tap a side to see who picked it */}
      <div className="px-5 pt-3 pb-1">
        <div className="grid grid-cols-3 gap-2">
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
                    <span className="text-white text-sm font-medium flex-1">
                      {pred.player_name}
                    </span>
                    {isCompleted && <PointsBadge points={pred.points} />}
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
              <span className="text-white text-sm font-medium flex-1">{pred.player_name}</span>
              <span className="text-xs text-slate-400">
                {pred.prediction === 'home'
                  ? match.home_team
                  : pred.prediction === 'away'
                    ? match.away_team
                    : 'Draw'}
              </span>
              {isCompleted && <PointsBadge points={pred.points} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Active / Locked match card ───────────────────────────────────────────────

function ActiveMatchCard({
  match,
  selectedPlayer,
  onPredicted,
}: {
  match: Match;
  selectedPlayer: number | null;
  onPredicted: () => void;
}) {
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(
    match.status === 'locked' || new Date(match.kickoff_time) <= new Date()
  );

  useEffect(() => {
    if (!selectedPlayer) {
      setSelectedPrediction(null);
      setSubmitted(false);
      return;
    }
    const existing = match.predictions.find((p) => p.player_id === selectedPlayer);
    if (existing) {
      setSelectedPrediction(existing.prediction);
      setSubmitted(true);
    } else {
      setSelectedPrediction(null);
      setSubmitted(false);
    }
  }, [selectedPlayer, match.predictions]);

  const handleSubmit = async () => {
    if (!selectedPlayer || !selectedPrediction) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/submitPrediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: match.id,
          player_id: selectedPlayer,
          prediction: selectedPrediction,
        }),
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
          <div className="flex items-center gap-3 rounded-xl bg-green-600/10 border border-green-500/30 px-4 py-3">
            <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-green-300 text-sm font-semibold">
                Your prediction:{' '}
                <span className="text-white">
                  {selectedPrediction === 'home'
                    ? match.home_team
                    : selectedPrediction === 'away'
                      ? match.away_team
                      : 'Draw'}
                </span>
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                Predictions are final and can&apos;t be changed.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isLocked && selectedPlayer && !submitted && (
        <div className="px-6 pb-6 space-y-3 border-t border-slate-700/50 pt-4">
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
          {selectedPrediction && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {submitting ? 'Saving...' : 'Submit Prediction'}
            </button>
          )}
          <p className="text-slate-500 text-xs text-center">
            Choose carefully — a prediction can only be made once.
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

      {/* Predictions list — visible after lock, open by default */}
      {isLocked && (
        <PredictionsList predictions={match.predictions} match={match} defaultOpen={true} />
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

      {/* Predictions — collapsed by default */}
      <PredictionsList predictions={match.predictions} match={match} defaultOpen={false} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const WcPredict: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [sharing, setSharing] = useState(false);

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
          if (crossOrigin) image.crossOrigin = 'anonymous';
          image.onload = () => resolve(image);
          image.onerror = () => resolve(null);
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
      const [matchRes, playersRes, lbRes] = await Promise.all([
        fetch('/.netlify/functions/getActiveWcMatch'),
        fetch('/.netlify/functions/getPlayers'),
        fetch('/.netlify/functions/getWcLeaderboard'),
      ]);
      const matchData = await matchRes.json();
      const playersData = await playersRes.json();
      const lbData = await lbRes.json();
      setMatches(matchData.matches ?? []);
      setPlayers(playersData);
      setLeaderboard(lbData);
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

  const hasActiveMatches = activeMatches.length > 0;

  return (
    <div className="min-h-screen bg-slate-900 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-900 via-slate-900 to-slate-900 border-b border-slate-700/60 px-4 py-6">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Trophy size={22} className="text-amber-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">FIFA World Cup 2026</h1>
          </div>
          <p className="text-slate-400 text-sm">Cogni HFX FC — Match Predictor</p>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 pt-6 space-y-6">

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
                    <div className="flex items-center gap-3 px-1 py-2 mb-1">
                      <div className="h-px flex-1 bg-slate-700/50" />
                      <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Chasing the podium</span>
                      <div className="h-px flex-1 bg-slate-700/50" />
                    </div>
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
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Completed matches section */}
        {completedMatches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700/60" />
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
                Completed
              </span>
              <div className="h-px flex-1 bg-slate-700/60" />
            </div>
            {completedMatches.map((match) => (
              <CompletedMatchCard key={match.id} match={match} />
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
