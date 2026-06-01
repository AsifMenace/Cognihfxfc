import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import {
  FaSun, FaMoon, FaClock, FaMapMarkerAlt, FaCalendarAlt,
  FaShareAlt, FaHistory, FaCloudRain, FaSnowflake, FaBolt,
  FaCloud, FaSmog,
} from 'react-icons/fa';

interface Booking {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  session: 'morning' | 'night';
  field_number: number;
}

interface WeatherPoint {
  temp: number;
  code: number;
}

// Halifax coords
const LAT = 44.6488;
const LON = -63.5752;

function parseLocalDate(dateStr: string) {
  const match = String(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date(NaN);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function getDuration(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 1440;
  const diff = endMin - startMin;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function groupByMonth(bookings: Booking[]) {
  const groups: Record<string, Booking[]> = {};
  for (const b of bookings) {
    const d = parseLocalDate(b.booking_date);
    const key = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  }
  return groups;
}

function weatherEmoji(code: number): { icon: React.ReactNode; label: string; emoji: string } {
  if (code === 0) return { icon: <FaSun className="text-yellow-300" />, label: 'Clear', emoji: '☀️' };
  if (code <= 3) return { icon: <FaCloud className="text-gray-400" />, label: 'Cloudy', emoji: '⛅' };
  if (code <= 48) return { icon: <FaSmog className="text-gray-400" />, label: 'Foggy', emoji: '🌫️' };
  if (code <= 67) return { icon: <FaCloudRain className="text-blue-400" />, label: 'Rain', emoji: '🌧️' };
  if (code <= 77) return { icon: <FaSnowflake className="text-blue-200" />, label: 'Snow', emoji: '🌨️' };
  if (code <= 82) return { icon: <FaCloudRain className="text-blue-400" />, label: 'Showers', emoji: '🌦️' };
  return { icon: <FaBolt className="text-yellow-400" />, label: 'Thunderstorm', emoji: '⛈️' };
}

async function fetchWeather(): Promise<Map<string, WeatherPoint>> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&hourly=temperature_2m,weathercode&timezone=America%2FHalifax&forecast_days=16`;
  const res = await fetch(url);
  const data = await res.json();
  const map = new Map<string, WeatherPoint>();
  const times: string[] = data.hourly.time;
  const temps: number[] = data.hourly.temperature_2m;
  const codes: number[] = data.hourly.weathercode;
  times.forEach((t, i) => {
    map.set(t, { temp: Math.round(temps[i]), code: codes[i] });
  });
  return map;
}

function getWeatherForBooking(
  weatherMap: Map<string, WeatherPoint>,
  booking: Booking
): WeatherPoint | null {
  const datePart = String(booking.booking_date).match(/(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!datePart) return null;
  const hourStr = booking.start_time.substring(0, 2);
  const key = `${datePart}T${hourStr}:00`;
  return weatherMap.get(key) ?? null;
}

function shareSessionText(b: Booking): string {
  const date = parseLocalDate(b.booking_date);
  const dayStr = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const session = b.session === 'morning' ? '☀️ Morning' : '🌙 Night';
  return (
    `⚽ COGNI HFX FC\n` +
    `📅 ${dayStr}\n` +
    `⏰ ${formatTime(b.start_time)} – ${formatTime(b.end_time)}\n` +
    `📍 Field ${b.field_number} · ${session} Session\n\n` +
    `Are you in? 🙋`
  );
}

function shareText(bookings: Booking[], month: string): string {
  const lines = bookings.map((b) => {
    const date = parseLocalDate(b.booking_date);
    const dayStr = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    return `${b.session === 'morning' ? '☀️' : '🌙'} ${dayStr} · ${formatTime(b.start_time)} · Field ${b.field_number}`;
  });
  return `⚽ COGNI HFX FC — ${month}\n\n${lines.join('\n')}\n\nSee you on the pitch! 💪`;
}

// ─── Schedule share card ──────────────────────────────────────────────────────

function ScheduleShareCard({
  bookings,
  month,
  weatherMap,
  cardRef,
}: {
  bookings: Booking[];
  month: string;
  weatherMap: Map<string, WeatherPoint>;
  cardRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed', top: 0, left: 0, zIndex: 9999,
        width: '420px', backgroundColor: '#0f172a',
        fontFamily: 'system-ui, sans-serif', overflow: 'hidden',
        borderRadius: '16px',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 20px 14px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderBottom: '1px solid #1e3a5f' }}>
        <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Cogni HFX FC</div>
        <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>{month} Sessions</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
          {bookings.length} session{bookings.length !== 1 ? 's' : ''} scheduled
        </div>
      </div>

      {/* Sessions */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {bookings.map((b, i) => {
          const date = parseLocalDate(b.booking_date);
          const isNight = b.session === 'night';
          const wx = getWeatherForBooking(weatherMap, b);
          const wxInfo = wx ? weatherEmoji(wx.code) : null;
          return (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px',
              background: isNight ? 'rgba(59,130,246,0.08)' : 'rgba(251,191,36,0.08)',
              borderLeft: `3px solid ${isNight ? '#3b82f6' : '#fbbf24'}`,
            }}>
              <div style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                {isNight ? '🌙' : '☀️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                  {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                  {formatTime(b.start_time)} – {formatTime(b.end_time)}
                </div>
              </div>
              {/* Weather */}
              {wxInfo && wx && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                  <span style={{ fontSize: '14px' }}>{wxInfo.emoji}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>{wx.temp}°C</span>
                </div>
              )}
              <div style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                borderRadius: '6px', flexShrink: 0,
                background: isNight ? 'rgba(59,130,246,0.2)' : 'rgba(251,191,36,0.2)',
                color: isNight ? '#93c5fd' : '#fde68a',
              }}>
                Field {b.field_number}
              </div>
              <div style={{ fontSize: '12px', color: '#475569', fontWeight: 700, width: '18px', textAlign: 'right', flexShrink: 0 }}>
                {i + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 20px 16px', textAlign: 'center', color: '#334155', fontSize: '11px' }}>
        ⚽ cognihfxfc.netlify.app
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [weatherMap, setWeatherMap] = useState<Map<string, WeatherPoint>>(new Map());
  const [sharingSession, setSharingSession] = useState<number | null>(null);
  const [sharingMonth, setSharingMonth] = useState<string | null>(null);
  const [capturingMonth, setCapturingMonth] = useState<string | null>(null);
  const scheduleCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/.netlify/functions/getUpcomingBookings').then((r) => r.json()),
      fetch('/.netlify/functions/getPastBookings').then((r) => r.json()),
      fetchWeather().catch(() => new Map()),
    ]).then(([upData, pastData, wMap]) => {
      setUpcoming(Array.isArray(upData) ? upData : []);
      setPast(Array.isArray(pastData) ? pastData : []);
      setWeatherMap(wMap);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleShareSession = async (b: Booking) => {
    setSharingSession(b.id);
    const text = shareSessionText(b);
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
      }
    } catch { /* user cancelled */ }
    setSharingSession(null);
  };

  const handleShareMonth = async (month: string, monthBookings: Booking[]) => {
    setSharingMonth(month);
    setCapturingMonth(month);
    await new Promise((r) => setTimeout(r, 150));

    const el = scheduleCardRef.current;
    if (!el) { setCapturingMonth(null); setSharingMonth(null); return; }

    try {
      const dataUrl = await toPng(el, { backgroundColor: '#0f172a', pixelRatio: 2 });
      setCapturingMonth(null);
      await new Promise((r) => setTimeout(r, 80)); // let React unmount the overlay before share sheet opens

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${month.replace(' ', '-')}-schedule.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `COGNI HFX FC — ${month}` });
      } else {
        const text = shareText(monthBookings, month);
        if (navigator.share) await navigator.share({ text });
        else { await navigator.clipboard.writeText(text); alert('Copied to clipboard!'); }
      }
    } catch (err) {
      console.error(err);
      setCapturingMonth(null);
    } finally {
      setSharingMonth(null);
    }
  };

  const bookings = tab === 'upcoming' ? upcoming : past;
  const grouped = groupByMonth(bookings);
  const months = Object.keys(grouped);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-black">
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <FaCalendarAlt className="text-yellow-400 text-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Field Bookings</h1>
              <p className="text-gray-500 text-xs">{upcoming.length} upcoming · {past.length} past</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl">
          {(['upcoming', 'past'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${
                tab === t
                  ? 'bg-yellow-500 text-slate-900 shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'past' ? <FaHistory className="text-xs" /> : <FaCalendarAlt className="text-xs" />}
              {t === 'upcoming' ? 'Upcoming' : 'Past'}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <AnimatePresence mode="wait">
          {bookings.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="text-5xl mb-4">{tab === 'upcoming' ? '📅' : '🕰️'}</div>
              <p className="text-lg font-bold text-gray-400">
                {tab === 'upcoming' ? 'No upcoming bookings' : 'No past sessions yet'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grouped cards */}
        <div className="space-y-8">
          {months.map((month, mi) => (
            <motion.div
              key={month + tab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mi * 0.04 }}
            >
              {/* Month label */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-black text-yellow-400 uppercase tracking-widest">{month}</span>
                <div className="flex-1 h-px bg-yellow-500/20" />
                <span className="text-xs text-gray-600 font-semibold mr-1">
                  {grouped[month].length} session{grouped[month].length !== 1 ? 's' : ''}
                </span>
                {tab === 'upcoming' && (
                  <button
                    onClick={() => handleShareMonth(month, grouped[month])}
                    disabled={sharingMonth === month}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/25 text-yellow-400 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {sharingMonth === month
                      ? <div className="w-2.5 h-2.5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                      : <FaShareAlt className="text-xs" />}
                    Share
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {grouped[month].map((b, i) => {
                  const date = parseLocalDate(b.booking_date);
                  const isNight = b.session === 'night';
                  const duration = getDuration(b.start_time, b.end_time);
                  const weather = tab === 'upcoming' ? getWeatherForBooking(weatherMap, b) : null;
                  const wx = weather ? weatherEmoji(weather.code) : null;

                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: mi * 0.04 + i * 0.03 }}
                      className={`relative rounded-2xl overflow-hidden border ${
                        isNight
                          ? 'bg-gradient-to-br from-slate-800 to-blue-950/40 border-blue-500/20'
                          : 'bg-gradient-to-br from-slate-800 to-amber-950/30 border-yellow-500/20'
                      }`}
                    >
                      {/* Accent strip */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isNight ? 'bg-blue-500' : 'bg-yellow-500'}`} />

                      <div className="pl-5 pr-4 py-4 flex items-center gap-4">
                        {/* Session icon */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isNight ? 'bg-blue-500/15' : 'bg-yellow-500/15'
                        }`}>
                          {isNight
                            ? <FaMoon className="text-blue-400 text-lg" />
                            : <FaSun className="text-yellow-400 text-lg" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-black text-sm leading-tight">
                            {date.toLocaleDateString(undefined, { weekday: 'long' })}
                          </p>
                          <p className="text-gray-400 text-xs font-medium">
                            {date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <div className={`flex items-center gap-1.5 text-xs font-bold ${isNight ? 'text-blue-300' : 'text-yellow-300'}`}>
                              <FaClock className="opacity-70" />
                              <span>{formatTime(b.start_time)} – {formatTime(b.end_time)}</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              isNight ? 'bg-blue-500/20 text-blue-300' : 'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {duration}
                            </span>
                          </div>
                        </div>

                        {/* Right column: field + weather + share */}
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          {/* Field badge */}
                          <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-black ${
                            isNight ? 'bg-blue-500/15 text-blue-300' : 'bg-yellow-500/15 text-yellow-400'
                          }`}>
                            <FaMapMarkerAlt className="text-xs opacity-60" />
                            <span className="text-base leading-none">{b.field_number}</span>
                          </div>

                          {/* Weather */}
                          {wx && weather && (
                            <div className="flex items-center gap-1 text-xs font-bold text-gray-300">
                              <span className="text-sm">{wx.icon}</span>
                              <span>{weather.temp}°</span>
                            </div>
                          )}

                          {/* Share button */}
                          <button
                            onClick={() => handleShareSession(b)}
                            disabled={sharingSession === b.id}
                            className="text-gray-500 hover:text-yellow-400 transition-colors p-1"
                            title="Share this session"
                          >
                            {sharingSession === b.id
                              ? <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                              : <FaShareAlt className="text-sm" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Schedule share card — rendered visibly during capture */}
      {capturingMonth && (
        <ScheduleShareCard
          bookings={grouped[capturingMonth] ?? []}
          month={capturingMonth}
          weatherMap={weatherMap}
          cardRef={scheduleCardRef}
        />
      )}
    </div>
  );
}
