import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Title from '../components/Title';

interface Entry {
  id: number;
  name: string;
  position: string;
  jerseyNumber?: number;
  photo?: string;
  appearances: number;
  value: number;
}

const BASE_URL = '/.netlify/functions';

const LeaderboardSection: React.FC<{
  title: string;
  unit: string;
  entries: Entry[];
  loading: boolean;
}> = ({ title, unit, entries, loading }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-yellow-500/20 shadow-2xl p-6 mb-8">
    <h3 className="text-xl font-bold text-yellow-400 mb-4">{title}</h3>
    {loading ? (
      <p className="text-gray-500 text-sm">Loading...</p>
    ) : entries.length === 0 ? (
      <p className="text-gray-500 text-sm">No {unit} recorded yet.</p>
    ) : (
      <div className="space-y-3">
        {entries.map((player, idx) => (
          <Link
            key={player.id}
            to={`/player/${player.id}`}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              idx === 0
                ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-slate-900 shadow-xl'
                : 'bg-slate-700/50 hover:bg-slate-600/50'
            }`}
          >
            <span className="w-6 text-center font-black text-sm opacity-70">{idx + 1}</span>
            {player.photo ? (
              <img
                src={player.photo}
                alt=""
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/50">
                {player.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{player.name.toUpperCase()}</p>
              <p className="text-xs opacity-70">
                {player.position} · {player.appearances} apps
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">{player.value}</p>
              <p className="text-xs opacity-70">{unit}</p>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
);

const HallOfFame: React.FC = () => {
  const [topScorers, setTopScorers] = useState<Entry[]>([]);
  const [topAssists, setTopAssists] = useState<Entry[]>([]);
  const [topSaves, setTopSaves] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scorersRes, assistsRes, savesRes] = await Promise.all([
          fetch(`${BASE_URL}/getHallOfFame?category=scorers&limit=15`),
          fetch(`${BASE_URL}/getHallOfFame?category=assists&limit=15`),
          fetch(`${BASE_URL}/getHallOfFame?category=saves&limit=15`),
        ]);

        if (!scorersRes.ok || !assistsRes.ok || !savesRes.ok) {
          throw new Error('Failed to load hall of fame data');
        }

        setTopScorers(await scorersRes.json());
        setTopAssists(await assistsRes.json());
        setTopSaves(await savesRes.json());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (error) {
    return <p className="text-center text-red-500 py-10">Error: {error}</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Title>Hall Of Fame</Title>
        <p className="text-center text-gray-400 -mt-6 mb-10">All-time club leaders</p>

        <LeaderboardSection title="GOLDEN BOOT ⚽" unit="goals" entries={topScorers} loading={loading} />
        <LeaderboardSection
          title="GOLDEN PLAYMAKER 🅰️"
          unit="assists"
          entries={topAssists}
          loading={loading}
        />
        <LeaderboardSection title="GOLDEN GLOVE 🧤" unit="saves" entries={topSaves} loading={loading} />

        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-slate-900 font-bold rounded-full hover:bg-yellow-400 hover:scale-105 transition-all shadow-lg"
          >
            ← BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HallOfFame;
