import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, RefreshCw, CheckCircle2, AlertCircle, Zap, Clock } from 'lucide-react';

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
}

function FlagImg({ src, alt }: { src: string | null | undefined; alt: string }) {
  const [err, setErr] = useState(false);

  // Handle missing or empty src
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
  const [deactivating, setDeactivating] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);

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

  const activateMatch = async (fixture: Fixture) => {
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Activation failed');
      showMessage('success', `${fixture.home_team} vs ${fixture.away_team} activated`);
      fetchActiveMatches();
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setActivating(null);
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

  // Check if a fixture is already activated
  const isActivated = (fixtureId: number) => activeMatches.some((m) => m.fixture_id === fixtureId);

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
          </div>
        </div>
      </div>

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
        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              <h2 className="text-white font-semibold text-sm">
                Active Matches
                {activeMatches.length > 0 && (
                  <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                    {activeMatches.length}
                  </span>
                )}
              </h2>
            </div>
            <button
              onClick={fetchActiveMatches}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            {loadingActive ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : activeMatches.length === 0 ? (
              <p className="text-slate-400 text-sm">No active matches. Activate some below.</p>
            ) : (
              activeMatches.map((m) => (
                <div
                  key={m.id}
                  className="space-y-3 pb-4 border-b border-slate-700/50 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <FlagImg src={m.home_flag ?? ''} alt={m.home_team} />
                      <span className="text-white font-semibold text-sm">{m.home_team}</span>
                    </div>
                    <span className="text-slate-500 font-black text-sm">VS</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="text-white font-semibold text-sm">{m.away_team}</span>
                      <FlagImg src={m.away_flag ?? ''} alt={m.away_team} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                        m.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : m.status === 'locked'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {m.status}
                    </span>
                    <span className="text-slate-400 text-xs flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(m.kickoff_time).toLocaleString()}
                    </span>
                    {m.result && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-semibold">
                        Result:{' '}
                        {m.result === 'home'
                          ? m.home_team
                          : m.result === 'away'
                            ? m.away_team
                            : 'Draw'}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {(m.status === 'locked' || m.status === 'completed') && (
                      <button
                        onClick={() => fetchResult(m.id)}
                        disabled={fetchingResult === m.id || m.status === 'completed'}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <RefreshCw
                          size={14}
                          className={fetchingResult === m.id ? 'animate-spin' : ''}
                        />
                        {m.status === 'completed'
                          ? 'Result already fetched'
                          : fetchingResult === m.id
                            ? 'Fetching...'
                            : 'Fetch Result from API'}
                      </button>
                    )}
                    {m.status === 'active' && (
                      <button
                        onClick={() => deactivateMatch(m.id)}
                        disabled={deactivating === m.id}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                        title="Deactivate only if no predictions have been made"
                      >
                        {deactivating === m.id ? '...' : 'Deactivate'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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
                      className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${
                        activated
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-slate-700/50 border-slate-600/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FlagImg src={fix.home_flag} alt={fix.home_team} />
                        <span className="text-white text-sm font-medium truncate">
                          {fix.home_team}
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                        <span className="text-slate-500 text-xs font-black">VS</span>
                        <span className="text-slate-500 text-xs">
                          {new Date(fix.kickoff_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-white text-sm font-medium truncate">
                          {fix.away_team}
                        </span>
                        <FlagImg src={fix.away_flag} alt={fix.away_team} />
                      </div>
                      <button
                        onClick={() => !activated && activateMatch(fix)}
                        disabled={activating === fix.fixture_id || activated}
                        className={`ml-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex-shrink-0 ${
                          activated
                            ? 'bg-green-600/20 text-green-400 cursor-default'
                            : 'bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white'
                        }`}
                      >
                        {activated
                          ? '✓ Active'
                          : activating === fix.fixture_id
                            ? '...'
                            : 'Activate'}
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
