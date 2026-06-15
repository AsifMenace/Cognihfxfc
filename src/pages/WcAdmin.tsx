import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, RefreshCw, CheckCircle2, AlertCircle, Zap, Clock, Activity, ExternalLink, Star } from 'lucide-react';

interface Fixture {
  fixture_id: number;
  home_team: string;
  away_team: string;
  home_code: string;
  away_code: string;
  home_flag: string;
  away_flag: string;
  kickoff_time: string;
  status: string;
}

interface ActiveMatch {
  id: number;
  fixture_id: number;
  home_team: string;
  away_team: string;
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
}

// Halifax-local calendar date (YYYY-MM-DD) — defines "a day" for the
// one-banker-match-per-day rule. Mirrors the backend (activateWcMatch.js).
function halifaxDay(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Halifax',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function FlagImg({ src, alt }: { src: string | null | undefined; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) return <span>🏳️</span>;
  return (
    <img
      src={src}
      alt={alt}
      className="w-8 h-5 object-cover rounded"
      style={{ border: '1px solid rgba(0,0,0,0.15)' }}
      onError={() => setErr(true)}
    />
  );
}

const WcAdmin: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const navigate = useNavigate();

  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [activeMatches, setActiveMatches] = useState<ActiveMatch[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [loadingActive, setLoadingActive] = useState(true);
  const [activating, setActivating] = useState<number | null>(null);
  const [fetchingResult, setFetchingResult] = useState<number | null>(null);
  const [fetchingLive, setFetchingLive] = useState<number | null>(null);
  const [deactivating, setDeactivating] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [manualForm, setManualForm] = useState<{ [matchId: number]: { home: string; away: string } }>({});
  const [manualOpen, setManualOpen] = useState<number | null>(null);
  const [settingManual, setSettingManual] = useState<number | null>(null);
  const [settingLiveManual, setSettingLiveManual] = useState<number | null>(null);
  // Activation modal — lets the admin designate one banker match per day.
  const [activateModal, setActivateModal] = useState<{ fixture: Fixture; banker: boolean } | null>(null);

  useEffect(() => {
    if (!isAdmin) navigate('/admin-login');
  }, [isAdmin, navigate]);

  useEffect(() => {
    fetchActiveMatches();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchActiveMatches = async () => {
    setLoadingActive(true);
    try {
      const res = await fetch('/.netlify/functions/getActiveWcMatch');
      const data = await res.json();
      setActiveMatches(data.matches ?? []);
    } catch {
      // silent
    } finally {
      setLoadingActive(false);
    }
  };

  const fetchFixtures = async () => {
    setLoadingFixtures(true);
    setMessage(null);
    try {
      const res = await fetch(`/.netlify/functions/getWcFixtures?date=${dateInput}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch fixtures');
      if (!Array.isArray(data) || data.length === 0) {
        showMessage('error', 'No World Cup matches found for this date.');
        setFixtures([]);
      } else {
        setFixtures(data);
      }
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to fetch fixtures');
    } finally {
      setLoadingFixtures(false);
    }
  };

  const activateMatch = async (fixture: Fixture, isBankerMatch: boolean) => {
    setActivating(fixture.fixture_id);
    setMessage(null);
    try {
      const res = await fetch('/.netlify/functions/activateWcMatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixture_id: fixture.fixture_id,
          home_team: fixture.home_team,
          away_team: fixture.away_team,
          home_code: fixture.home_code,
          away_code: fixture.away_code,
          home_flag: fixture.home_flag,
          away_flag: fixture.away_flag,
          kickoff_time: fixture.kickoff_time,
          is_banker_match: isBankerMatch,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Activation failed');
      showMessage(
        'success',
        `${fixture.home_team} vs ${fixture.away_team} activated${isBankerMatch ? ' as Banker match' : ''}`
      );
      setActivateModal(null);
      fetchActiveMatches();
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setActivating(null);
    }
  };

  const fetchLiveScore = async (matchId: number, homeTeam: string, awayTeam: string) => {
    setFetchingLive(matchId);
    setMessage(null);
    try {
      const res = await fetch('/.netlify/functions/fetchWcLiveScore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch live score');
      showMessage(
        'success',
        data.live_home_goals !== null
          ? `${homeTeam} ${data.live_home_goals} – ${data.live_away_goals} ${awayTeam} (${data.api_status})`
          : data.message
      );
      fetchActiveMatches();
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to fetch live score');
    } finally {
      setFetchingLive(null);
    }
  };

  const fetchResult = async (matchId: number) => {
    setFetchingResult(matchId);
    setMessage(null);
    try {
      const res = await fetch('/.netlify/functions/fetchWcResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch result');
      showMessage('success', data.message);
      fetchActiveMatches();
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to fetch result');
    } finally {
      setFetchingResult(null);
    }
  };

  const deactivateMatch = async (matchId: number) => {
    setDeactivating(matchId);
    setMessage(null);
    try {
      const res = await fetch('/.netlify/functions/deactivateWcMatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to deactivate match');
      showMessage('success', data.message);
      fetchActiveMatches();
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to deactivate match');
    } finally {
      setDeactivating(null);
    }
  };

  const setLiveScoreManually = async (matchId: number) => {
    const form = manualForm[matchId];
    if (!form) return;
    const hg = parseInt(form.home, 10);
    const ag = parseInt(form.away, 10);
    if (isNaN(hg) || isNaN(ag) || hg < 0 || ag < 0) {
      showMessage('error', 'Enter valid non-negative scores for both teams.');
      return;
    }
    setSettingLiveManual(matchId);
    setMessage(null);
    try {
      const res = await fetch('/.netlify/functions/setWcLiveScoreManual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, home_goals: hg, away_goals: ag }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update live score');
      showMessage('success', data.message);
      fetchActiveMatches();
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to update live score');
    } finally {
      setSettingLiveManual(null);
    }
  };

  const setResultManually = async (matchId: number) => {
    const form = manualForm[matchId];
    if (!form) return;
    const hg = parseInt(form.home, 10);
    const ag = parseInt(form.away, 10);
    if (isNaN(hg) || isNaN(ag) || hg < 0 || ag < 0) {
      showMessage('error', 'Enter valid non-negative scores for both teams.');
      return;
    }
    setSettingManual(matchId);
    setMessage(null);
    try {
      const res = await fetch('/.netlify/functions/setWcResultManual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, home_goals: hg, away_goals: ag }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set result');
      showMessage('success', data.message);
      setManualOpen(null);
      setManualForm((prev) => { const next = { ...prev }; delete next[matchId]; return next; });
      fetchActiveMatches();
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to set result');
    } finally {
      setSettingManual(null);
    }
  };

  const isActivated = (fixtureId: number) => activeMatches.some((m) => m.fixture_id === fixtureId);

  // While the activation modal is open: the match (if any) that already holds the
  // banker on that fixture's Halifax-local day. If set, the banker option is hidden.
  const modalDayBanker = activateModal
    ? activeMatches.find(
        (m) =>
          m.is_banker_match &&
          halifaxDay(m.kickoff_time) === halifaxDay(activateModal.fixture.kickoff_time)
      )
    : undefined;

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-900 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-900 via-slate-900 to-slate-900 border-b border-slate-700/60 px-4 py-6">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-600/30">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">WC Predictor Admin</h1>
              <p className="text-slate-400 text-sm">FIFA World Cup 2026</p>
            </div>
            <button
              onClick={() => navigate('/predict')}
              className="ml-auto flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600/30 active:bg-green-600/40 border border-green-500/30 text-green-400 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <ExternalLink size={14} />
              Predict page
            </button>
          </div>
        </div>
      </div>

      {/* Activation modal — designate the day's banker match before activating */}
      {activateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-700/60">
              <h3 className="text-white font-bold text-base">Activate match</h3>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Teams */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FlagImg src={activateModal.fixture.home_flag} alt={activateModal.fixture.home_team} />
                  <span className="text-white font-semibold text-sm truncate">{activateModal.fixture.home_team}</span>
                </div>
                <span className="text-slate-500 font-black text-xs flex-shrink-0">VS</span>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-white font-semibold text-sm truncate text-right">{activateModal.fixture.away_team}</span>
                  <FlagImg src={activateModal.fixture.away_flag} alt={activateModal.fixture.away_team} />
                </div>
              </div>
              <p className="text-slate-400 text-xs flex items-center gap-1.5">
                <Clock size={11} />
                {new Date(activateModal.fixture.kickoff_time).toLocaleString()}
              </p>

              {/* Banker toggle — hidden once the day already has a banker match */}
              {modalDayBanker ? (
                <div className="flex items-start gap-2 rounded-xl bg-slate-700/40 border border-slate-600/50 px-3 py-2.5 text-slate-400 text-xs">
                  <Star size={14} className="flex-shrink-0 mt-0.5 text-slate-500" />
                  Banker already set for this day on {modalDayBanker.home_team} vs{' '}
                  {modalDayBanker.away_team}.
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActivateModal((s) => (s ? { ...s, banker: !s.banker } : s))}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border text-left transition-colors ${
                      activateModal.banker
                        ? 'bg-amber-500/15 border-amber-500/50'
                        : 'bg-slate-700/40 border-slate-600/50 hover:border-slate-500'
                    }`}
                  >
                    <Star
                      size={18}
                      className={`flex-shrink-0 ${activateModal.banker ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-bold ${activateModal.banker ? 'text-amber-200' : 'text-slate-200'}`}>
                        Make this the Banker match
                      </span>
                      <span className="block text-xs text-slate-400 mt-0.5">One banker match per day</span>
                    </span>
                    <span
                      className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors relative ${
                        activateModal.banker ? 'bg-amber-500' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                          activateModal.banker ? 'left-[1.125rem]' : 'left-0.5'
                        }`}
                      />
                    </span>
                  </button>

                  {activateModal.banker && (
                    <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2.5 text-amber-300 text-xs">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      Once activated, the banker designation can&apos;t be changed for the day.
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-700/60 flex gap-2">
              <button
                onClick={() => setActivateModal(null)}
                disabled={activating === activateModal.fixture.fixture_id}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => activateMatch(activateModal.fixture, activateModal.banker)}
                disabled={activating === activateModal.fixture.fixture_id}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {activating === activateModal.fixture.fixture_id
                  ? 'Activating...'
                  : activateModal.banker
                    ? 'Activate as Banker'
                    : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-3xl px-4 pt-6 space-y-6">
        {/* Message */}
        {message && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                : 'bg-red-500/15 border border-red-500/30 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {/* Active Matches */}
        {(() => {
          const inProgress = activeMatches.filter((m) => m.status !== 'completed');
          const completed = activeMatches
            .filter((m) => m.status === 'completed')
            .sort((a, b) => new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime());
          return (
            <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden">
              {/* Panel header */}
              <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-amber-400" />
                  <h2 className="text-white font-semibold text-sm">
                    Active Matches
                    {inProgress.length > 0 && (
                      <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                        {inProgress.length}
                      </span>
                    )}
                  </h2>
                </div>
                <button
                  onClick={fetchActiveMatches}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              <div className="px-4 py-4 space-y-4">
                {loadingActive ? (
                  <p className="text-slate-400 text-sm">Loading...</p>
                ) : activeMatches.length === 0 ? (
                  <p className="text-slate-400 text-sm">No active matches. Activate some below.</p>
                ) : (
                  <>
                    {/* In-progress matches — full cards */}
                    {inProgress.length === 0 ? (
                      <p className="text-slate-500 text-sm">No matches in progress.</p>
                    ) : (
                      inProgress.map((m) => (
                        <div
                          key={m.id}
                          className="space-y-3 pb-4 border-b border-slate-700/50 last:border-0 last:pb-0"
                        >
                          {/* Teams */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FlagImg src={m.home_flag ?? ''} alt={m.home_team} />
                              <span className="text-white font-semibold text-sm truncate">{m.home_team}</span>
                            </div>
                            <span className="text-slate-500 font-black text-xs flex-shrink-0">VS</span>
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                              <span className="text-white font-semibold text-sm truncate text-right">{m.away_team}</span>
                              <FlagImg src={m.away_flag ?? ''} alt={m.away_team} />
                            </div>
                          </div>

                          {/* Live score */}
                          {m.live_home_goals !== null && m.live_away_goals !== null && (
                            <div className="flex items-center justify-center gap-2 bg-slate-700/60 rounded-xl py-2 px-3">
                              <span className="text-white font-bold text-xs truncate max-w-[70px]">{m.home_team}</span>
                              <span className="text-white font-black text-lg tabular-nums flex-shrink-0">
                                {m.live_home_goals} – {m.live_away_goals}
                              </span>
                              <span className="text-white font-bold text-xs truncate max-w-[70px] text-right">{m.away_team}</span>
                              {m.live_fetched_at && (
                                <span className="text-slate-500 text-xs flex-shrink-0">
                                  {new Date(m.live_fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Status + kickoff */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                m.status === 'locked'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {m.status}
                            </span>
                            {m.is_banker_match && (
                              <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                                <Star size={10} className="fill-amber-400" />
                                Banker
                              </span>
                            )}
                            <span className="text-slate-400 text-xs flex items-center gap-1">
                              <Clock size={11} />
                              {new Date(m.kickoff_time).toLocaleString()}
                            </span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2 flex-wrap">
                            {m.status === 'locked' && (
                              <button
                                onClick={() => fetchLiveScore(m.id, m.home_team, m.away_team)}
                                disabled={fetchingLive === m.id}
                                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 min-w-[110px]"
                              >
                                <Activity size={14} className={fetchingLive === m.id ? 'animate-pulse' : ''} />
                                {fetchingLive === m.id ? 'Fetching...' : 'Live Score'}
                              </button>
                            )}
                            {m.status === 'locked' && (
                              <button
                                onClick={() => fetchResult(m.id)}
                                disabled={fetchingResult === m.id}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 min-w-[110px]"
                              >
                                <RefreshCw size={14} className={fetchingResult === m.id ? 'animate-spin' : ''} />
                                {fetchingResult === m.id ? 'Fetching...' : 'Final Result'}
                              </button>
                            )}
                            {m.status === 'locked' && (
                              <button
                                onClick={() =>
                                  setManualOpen((prev) => (prev === m.id ? null : m.id))
                                }
                                className="flex-1 py-2.5 bg-slate-600 hover:bg-slate-500 active:bg-slate-700 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 min-w-[110px]"
                              >
                                Set Manually
                              </button>
                            )}
                            {m.status === 'active' && (
                              <button
                                onClick={() => deactivateMatch(m.id)}
                                disabled={deactivating === m.id}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                                title="Deactivate only if no predictions have been made"
                              >
                                {deactivating === m.id ? '...' : 'Deactivate'}
                              </button>
                            )}
                          </div>

                          {/* Manual score entry form */}
                          {m.status === 'locked' && manualOpen === m.id && (
                            <div className="bg-slate-900/60 border border-slate-600/60 rounded-xl p-3 space-y-3">
                              <p className="text-slate-400 text-xs">Enter the final score manually:</p>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                  <label className="text-slate-400 text-xs truncate">{m.home_team}</label>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={manualForm[m.id]?.home ?? ''}
                                    onChange={(e) =>
                                      setManualForm((prev) => ({
                                        ...prev,
                                        [m.id]: { home: e.target.value, away: prev[m.id]?.away ?? '' },
                                      }))
                                    }
                                    className="w-full bg-slate-700 border border-slate-600 text-white text-center text-lg font-bold rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                  />
                                </div>
                                <span className="text-slate-500 font-black text-lg mt-5 flex-shrink-0">–</span>
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                  <label className="text-slate-400 text-xs truncate text-right">{m.away_team}</label>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={manualForm[m.id]?.away ?? ''}
                                    onChange={(e) =>
                                      setManualForm((prev) => ({
                                        ...prev,
                                        [m.id]: { home: prev[m.id]?.home ?? '', away: e.target.value },
                                      }))
                                    }
                                    className="w-full bg-slate-700 border border-slate-600 text-white text-center text-lg font-bold rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setLiveScoreManually(m.id)}
                                  disabled={
                                    settingLiveManual === m.id ||
                                    settingManual === m.id ||
                                    !manualForm[m.id]?.home ||
                                    !manualForm[m.id]?.away
                                  }
                                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-sm"
                                >
                                  {settingLiveManual === m.id ? 'Updating...' : 'Update Live Score'}
                                </button>
                                <button
                                  onClick={() => setResultManually(m.id)}
                                  disabled={
                                    settingManual === m.id ||
                                    settingLiveManual === m.id ||
                                    !manualForm[m.id]?.home ||
                                    !manualForm[m.id]?.away
                                  }
                                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-sm"
                                >
                                  {settingManual === m.id ? 'Saving...' : 'Final & Award Points'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {/* Completed matches — collapsible compact list */}
                    {completed.length > 0 && (
                      <div className={inProgress.length > 0 ? 'pt-2 border-t border-slate-700/50' : ''}>
                        <button
                          onClick={() => setCompletedExpanded((v) => !v)}
                          className="w-full flex items-center justify-between py-2 text-slate-400 hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span className="text-sm font-medium">Completed</span>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">
                              {completed.length}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">{completedExpanded ? '▲ hide' : '▼ show'}</span>
                        </button>

                        {completedExpanded && (
                          <div className="mt-1 space-y-2">
                            {completed.map((m) => (
                              <div
                                key={m.id}
                                className="flex flex-col gap-1.5 bg-slate-700/40 rounded-xl px-3 py-2.5"
                              >
                                {/* Teams + score row */}
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <FlagImg src={m.home_flag ?? ''} alt={m.home_team} />
                                    <span className="text-slate-300 text-xs font-medium truncate">{m.home_team}</span>
                                  </div>
                                  <span className="text-white font-black text-sm tabular-nums flex-shrink-0">
                                    {m.final_home_goals !== null && m.final_away_goals !== null
                                      ? `${m.final_home_goals} – ${m.final_away_goals}`
                                      : m.live_home_goals !== null && m.live_away_goals !== null
                                        ? `${m.live_home_goals} – ${m.live_away_goals}`
                                        : 'FT'}
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                                    <span className="text-slate-300 text-xs font-medium truncate text-right">{m.away_team}</span>
                                    <FlagImg src={m.away_flag ?? ''} alt={m.away_team} />
                                  </div>
                                </div>
                                {/* Winner chip — always visible */}
                                {m.result && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                                      Winner: {m.result === 'home' ? m.home_team : m.result === 'away' ? m.away_team : 'Draw'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Fetch Fixtures */}
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700/50">
            <h2 className="text-white font-semibold text-sm">World Cup Fixtures</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={fetchFixtures}
                disabled={loadingFixtures}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm flex items-center gap-2"
              >
                <RefreshCw size={14} className={loadingFixtures ? 'animate-spin' : ''} />
                {loadingFixtures ? 'Loading...' : 'Fetch'}
              </button>
            </div>

            {fixtures.length > 0 && (
              <div className="space-y-2 mt-2">
                {fixtures.map((fix) => {
                  const activated = isActivated(fix.fixture_id);
                  return (
                    <div
                      key={fix.fixture_id}
                      className={`flex flex-col gap-2 border rounded-xl px-4 py-3 ${
                        activated
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-slate-700/50 border-slate-600/50'
                      }`}
                    >
                      {/* Teams row — full width, no button competing */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FlagImg src={fix.home_flag} alt={fix.home_team} />
                          <span className="text-white text-sm font-medium truncate">{fix.home_team}</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-1">
                          <span className="text-slate-500 text-xs font-black">VS</span>
                          <span className="text-slate-500 text-xs">
                            {new Date(fix.kickoff_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="text-white text-sm font-medium truncate text-right">{fix.away_team}</span>
                          <FlagImg src={fix.away_flag} alt={fix.away_team} />
                        </div>
                      </div>
                      {/* Activate button — own row, full width */}
                      <button
                        onClick={() => !activated && setActivateModal({ fixture: fix, banker: false })}
                        disabled={activating === fix.fixture_id || activated}
                        className={`w-full py-2 text-xs font-bold rounded-lg transition-colors ${
                          activated
                            ? 'bg-green-600/20 text-green-400 cursor-default'
                            : 'bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 text-white'
                        }`}
                      >
                        {activated ? '✓ Active' : activating === fix.fixture_id ? '...' : 'Activate'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WcAdmin;
