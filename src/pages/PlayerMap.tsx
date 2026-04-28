import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Car, Users, UserX, Phone } from 'lucide-react';

const iconPrototype = L.Icon.Default.prototype as L.Icon.Default & {
  _getIconUrl?: () => string;
};
delete iconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Player {
  id: number;
  name: string;
  position: string;
  jerseyNumber: number;
  photo?: string;
  address?: string;
  hasCar?: boolean;
  contact?: string;
  lat?: number | null;
  lng?: number | null;
}

function createPlayerIcon(player: Player, highlighted: boolean): L.DivIcon {
  const ring = highlighted ? '#f59e0b' : player.hasCar ? '#22c55e' : '#3b82f6';
  const size = highlighted ? 52 : 44;

  const photoHtml = player.photo
    ? `<img src="${player.photo}" alt="${player.name}" style="
        width:${size}px;height:${size}px;border-radius:50%;
        object-fit:cover;border:2.5px solid ${ring};display:block;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);"/>`
    : `<div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:#1e293b;border:2.5px solid ${ring};
        display:flex;align-items:center;justify-content:center;
        color:white;font-size:${Math.round(size * 0.38)}px;font-weight:700;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);">
        ${player.name.charAt(0)}</div>`;

  const carBadge = player.hasCar
    ? `<div style="position:absolute;bottom:-1px;right:-1px;
        background:#16a34a;border-radius:50%;width:16px;height:16px;
        display:flex;align-items:center;justify-content:center;
        font-size:9px;border:2px solid white;
        box-shadow:0 1px 3px rgba(0,0,0,0.3);">🚗</div>`
    : '';

  const nameTag = `<div style="
    position:absolute;top:-22px;left:50%;transform:translateX(-50%);
    background:rgba(2,6,23,0.9);color:white;
    font-size:10px;font-weight:600;white-space:nowrap;
    padding:2px 7px;border-radius:10px;
    font-family:'Inter','Segoe UI',sans-serif;letter-spacing:0.3px;
    border:1px solid rgba(255,255,255,0.1);
    box-shadow:0 1px 4px rgba(0,0,0,0.4);">${player.name}</div>`;

  return L.divIcon({
    html: `<div style="position:relative;display:inline-block;">
      ${photoHtml}${carBadge}${nameTag}
    </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 26)],
  });
}

function FitBounds({ players }: { players: Player[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = players.filter((p) => p.lat != null && p.lng != null);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView([pts[0].lat!, pts[0].lng!], 15);
    } else {
      map.fitBounds(L.latLngBounds(pts.map((p) => [p.lat!, p.lng!] as [number, number])), {
        padding: [70, 70],
      });
    }
  }, [players, map]);
  return null;
}

const HALIFAX_CENTER: [number, number] = [44.6488, -63.5752];

const POSITION_COLORS: Record<string, string> = {
  Goalkeeper: '#f59e0b',
  Defender: '#3b82f6',
  Midfielder: '#8b5cf6',
  Forward: '#ef4444',
};

const PlayerMap: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCar, setFilterCar] = useState<'all' | 'car' | 'nocar'>('all');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch('/.netlify/functions/getPlayers');
        if (!res.ok) throw new Error('Failed to fetch players');
        setPlayers(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  const mappable = players.filter((p) => p.lat != null && p.lng != null);
  const filtered = mappable.filter((p) => {
    if (filterCar === 'car') return p.hasCar === true;
    if (filterCar === 'nocar') return !p.hasCar;
    return true;
  });
  const notMapped = players.filter((p) => !p.lat || !p.lng);
  const withCar = mappable.filter((p) => p.hasCar).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">
            Loading player map...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <MapPin size={36} className="mx-auto mb-3 text-red-500 opacity-70" />
          <p className="font-semibold text-white">Failed to load players</p>
          <p className="text-sm text-slate-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/60 px-4 py-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <MapPin size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Player Map</h1>
                <p className="text-slate-400 text-sm">Cogni HFX FC — Halifax, NS</p>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-xl p-1">
              {(['all', 'car', 'nocar'] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => setFilterCar(val)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filterCar === val
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {val === 'all' ? 'All Players' : val === 'car' ? '🚗 Has Car' : 'No Car'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              {
                icon: <Users size={15} />,
                label: 'On Map',
                value: mappable.length,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10 border-blue-500/20',
              },
              {
                icon: <Car size={15} />,
                label: 'Have Cars',
                value: withCar,
                color: 'text-green-400',
                bg: 'bg-green-500/10 border-green-500/20',
              },
              {
                icon: <UserX size={15} />,
                label: 'No Address',
                value: notMapped.length,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10 border-amber-500/20',
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.bg}`}
              >
                <span className={s.color}>{s.icon}</span>
                <div>
                  <div className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto max-w-7xl px-4 py-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Map */}
          <div className="flex-1 min-w-0">
            <div
              className="rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl"
              style={{ height: 560 }}
            >
              <MapContainer
                center={HALIFAX_CENTER}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds players={filtered} />
                {filtered.map((player) => (
                  <Marker
                    key={player.id}
                    position={[player.lat!, player.lng!]}
                    icon={createPlayerIcon(player, highlightedId === player.id)}
                    eventHandlers={{
                      mouseover: () => setHighlightedId(player.id),
                      mouseout: () => setHighlightedId(null),
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 190, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 10,
                            paddingBottom: 10,
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          {player.photo ? (
                            <img
                              src={player.photo}
                              alt={player.name}
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #3b82f6',
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: '50%',
                                background: '#1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: 16,
                                flexShrink: 0,
                              }}
                            >
                              {player.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                              {player.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                marginTop: 2,
                                color: POSITION_COLORS[player.position] ?? '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}
                            >
                              {player.position}
                            </div>
                          </div>
                        </div>
                        {player.address && (
                          <div
                            style={{
                              display: 'flex',
                              gap: 7,
                              alignItems: 'flex-start',
                              fontSize: 12,
                              color: '#475569',
                              marginBottom: 7,
                            }}
                          >
                            <span style={{ marginTop: 1 }}>📍</span>
                            <span>{player.address}, Halifax</span>
                          </div>
                        )}
                        {player.contact && (
                          <div
                            style={{
                              display: 'flex',
                              gap: 7,
                              alignItems: 'center',
                              fontSize: 12,
                              color: '#475569',
                              marginBottom: 7,
                            }}
                          >
                            <span>📞</span>
                            <a
                              href={`tel:${player.contact}`}
                              style={{ color: '#3b82f6', fontWeight: 500, textDecoration: 'none' }}
                            >
                              {player.contact}
                            </a>
                          </div>
                        )}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            marginTop: 4,
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            background: player.hasCar ? '#dcfce7' : '#f1f5f9',
                            color: player.hasCar ? '#15803d' : '#64748b',
                            border: `1px solid ${player.hasCar ? '#86efac' : '#e2e8f0'}`,
                          }}
                        >
                          {player.hasCar ? '🚗 Has a car' : '🚶 No car'}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-3 px-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Ring:
              </span>
              {[
                { color: '#22c55e', label: 'Has car' },
                { color: '#3b82f6', label: 'No car' },
                { color: '#f59e0b', label: 'Hovered' },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span
                    className="inline-block w-3 h-3 rounded-full border-2"
                    style={{ borderColor: l.color }}
                  />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-64 xl:w-72 flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1">
              {filtered.length} player{filtered.length !== 1 ? 's' : ''} shown
            </h2>
            <div className="flex flex-col gap-2 max-h-[560px] overflow-y-auto pr-1">
              {filtered.map((player) => (
                <div
                  key={player.id}
                  onMouseEnter={() => setHighlightedId(player.id)}
                  onMouseLeave={() => setHighlightedId(null)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-default transition-all duration-150 ${
                    highlightedId === player.id
                      ? 'bg-slate-700 border-slate-500 shadow-lg'
                      : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/60'
                  }`}
                >
                  {player.photo ? (
                    <img
                      src={player.photo}
                      alt={player.name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-slate-600"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {player.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold truncate">{player.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs font-medium"
                        style={{ color: POSITION_COLORS[player.position] ?? '#94a3b8' }}
                      >
                        {player.position}
                      </span>
                      {player.hasCar && <span className="text-xs">🚗</span>}
                    </div>
                  </div>
                  {player.contact && (
                    <a
                      href={`tel:${player.contact}`}
                      className="text-slate-500 hover:text-blue-400 transition-colors flex-shrink-0"
                      title={player.contact}
                    >
                      <Phone size={14} />
                    </a>
                  )}
                </div>
              ))}

              {notMapped.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-semibold text-amber-500/80 uppercase tracking-widest px-1 mb-2">
                    No address set
                  </div>
                  {notMapped.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-amber-900/30 bg-amber-950/20 mb-2 opacity-60"
                    >
                      {p.photo ? (
                        <img
                          src={p.photo}
                          alt={p.name}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-amber-900/40 grayscale"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-sm flex-shrink-0">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-400 text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-amber-600/70 mt-0.5">No address</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerMap;
