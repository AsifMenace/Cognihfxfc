import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Image as ImageIcon, RefreshCw, Download, Youtube, Link2 } from 'lucide-react';
import { getAdminHeaders } from '../utils/auth';

interface YoutubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

interface Team {
  id: number;
  name: string;
  color: string | null;
}

interface Match {
  id: number;
  date: string;
  time: string;
  opponent: string | null;
  venue: string | null;
  isHome: boolean;
  home_team_id: number | null;
  away_team_id: number | null;
  home_team_name: string | null;
  home_team_color: string | null;
  away_team_name: string | null;
  away_team_color: string | null;
  video_url: string | null;
}

const CANVAS_W = 1280;
const CANVAS_H = 720;
const NAVY = '#0f172a';
const GOLD = '#fbbf24';
const LOGO_URL = 'https://res.cloudinary.com/mycloudasif/image/upload/v1755069690/logocogni_wunnvy.png';

const formatDateLong = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatDateForTitle = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime12h = (timeStr: string) => {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
};

const loadImage = (src: string, crossOrigin?: boolean) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (result: HTMLImageElement | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(result);
    };
    if (crossOrigin) img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => finish(null), 10000);
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    img.src = src;
  });

export default function ThumbnailGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | ''>('');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [fieldNumber, setFieldNumber] = useState('');

  const [teamAName, setTeamAName] = useState('Cogni HFX FC');
  const [teamAColor, setTeamAColor] = useState(GOLD);
  const [teamBName, setTeamBName] = useState('');
  const [teamBColor, setTeamBColor] = useState('#64748b');
  const [videoTitle, setVideoTitle] = useState('');

  const [photoUrl, setPhotoUrl] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);

  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'thumbnail' | 'link'>('thumbnail');
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [needsConnect, setNeedsConnect] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<YoutubeVideo[]>([]);
  const [pushingVideoId, setPushingVideoId] = useState<string | null>(null);
  const [pushMessage, setPushMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchNewPhoto = useCallback(async () => {
    setPhotoLoading(true);
    try {
      const res = await fetch('/.netlify/functions/getStadiumPhoto');
      const data = await res.json();
      if (res.ok) {
        setPhotoUrl(data.url);
        setPhotographer(data.photographer || '');
      }
    } catch {
      // Canvas falls back to a plain gradient background below.
    } finally {
      setPhotoLoading(false);
    }
  }, []);

  // Initial data load: matches, teams, club logo, first background photo.
  useEffect(() => {
    fetch('/.netlify/functions/getMatches')
      .then((res) => res.json())
      .then((data) => setMatches(Array.isArray(data) ? data : []))
      .catch(() => setMatches([]));

    fetch('/.netlify/functions/getTeams')
      .then((res) => res.json())
      .then((data) => setTeams(Array.isArray(data) ? data : []))
      .catch(() => setTeams([]));

    loadImage(LOGO_URL, true).then(setLogoImg);
    fetchNewPhoto();
  }, [fetchNewPhoto]);

  // Load the background photo into an <img> whenever the URL changes.
  useEffect(() => {
    if (!photoUrl) return;
    let cancelled = false;
    loadImage(photoUrl, true).then((img) => {
      if (!cancelled) setBgImg(img);
    });
    return () => {
      cancelled = true;
    };
  }, [photoUrl]);

  // Selecting a match auto-fills date/time/teams; still editable afterward.
  const handleSelectMatch = (id: number | '') => {
    setSelectedMatchId(id);
    if (id === '') return;
    const match = matches.find((m) => m.id === id);
    if (!match) return;

    setDate(match.date || '');
    setTime(match.time || '');

    let a = 'Cogni HFX FC';
    let b = match.opponent || '';
    if (match.home_team_name && match.away_team_name) {
      a = match.home_team_name;
      b = match.away_team_name;
      setTeamAColor(match.home_team_color || GOLD);
      setTeamBColor(match.away_team_color || '#64748b');
    } else {
      setTeamAColor(GOLD);
      setTeamBColor('#64748b');
    }
    setTeamAName(a);
    setTeamBName(b);

    const dateForTitle = formatDateForTitle(match.date || '');
    setVideoTitle(b ? `${a} vs ${b} - ${dateForTitle}` : `${a} - ${dateForTitle}`);
  };

  const applyQuickPick = (side: 'A' | 'B', teamId: string) => {
    const team = teams.find((t) => String(t.id) === teamId);
    if (!team) return;
    if (side === 'A') {
      setTeamAName(team.name);
      setTeamAColor(team.color || GOLD);
    } else {
      setTeamBName(team.name);
      setTeamBColor(team.color || '#64748b');
    }
  };

  // Redraw the canvas whenever any input changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // Background: cover-fit stock photo, or a navy gradient fallback.
    if (bgImg) {
      const scale = Math.max(CANVAS_W / bgImg.width, CANVAS_H / bgImg.height);
      const dw = bgImg.width * scale;
      const dh = bgImg.height * scale;
      ctx.drawImage(bgImg, (CANVAS_W - dw) / 2, (CANVAS_H - dh) / 2, dw, dh);
    } else {
      const fallback = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      fallback.addColorStop(0, '#0f1b2e');
      fallback.addColorStop(1, '#000000');
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Dark gradient overlays for text legibility.
    const topShade = ctx.createLinearGradient(0, 0, 0, 160);
    topShade.addColorStop(0, 'rgba(0,0,0,0.55)');
    topShade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, CANVAS_W, 160);

    const bottomShade = ctx.createLinearGradient(0, CANVAS_H - 340, 0, CANVAS_H);
    bottomShade.addColorStop(0, 'rgba(0,0,0,0)');
    bottomShade.addColorStop(1, 'rgba(0,0,0,0.88)');
    ctx.fillStyle = bottomShade;
    ctx.fillRect(0, CANVAS_H - 340, CANVAS_W, 340);

    // Club logo (top-left, circular, gold ring).
    const lx = 76;
    const ly = 76;
    const lr = 50;
    if (logoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const s = Math.max((lr * 2) / logoImg.width, (lr * 2) / logoImg.height);
      const dw = logoImg.width * s;
      const dh = logoImg.height * s;
      ctx.drawImage(logoImg, lx - dw / 2, ly - dh / 2, dw, dh);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = GOLD;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 30px system-ui, -apple-system, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText('COGNI HFX FC', lx + lr + 22, ly + 11);
    ctx.shadowBlur = 0;

    // Field number badge (top-right), only when provided.
    if (fieldNumber.trim() !== '') {
      const label = `FIELD ${fieldNumber.trim()}`;
      ctx.font = '800 30px system-ui, -apple-system, sans-serif';
      const textW = ctx.measureText(label).width;
      const padX = 24;
      const badgeW = textW + padX * 2;
      const badgeH = 58;
      const bx = CANVAS_W - 40 - badgeW;
      const by = 40;
      roundRect(bx, by, badgeW, badgeH, 16);
      ctx.fillStyle = 'rgba(15,23,42,0.75)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = GOLD;
      ctx.stroke();
      ctx.fillStyle = GOLD;
      ctx.textAlign = 'center';
      ctx.fillText(label, bx + badgeW / 2, by + badgeH / 2 + 10);
      ctx.textAlign = 'left';
    }

    // Team names ("A  vs  B"), auto-shrunk to fit.
    const teamsLabel = teamBName.trim()
      ? `${teamAName || 'Cogni HFX FC'}  vs  ${teamBName}`
      : teamAName || 'Cogni HFX FC';
    let teamFontSize = 64;
    ctx.textAlign = 'center';
    do {
      ctx.font = `800 ${teamFontSize}px system-ui, -apple-system, sans-serif`;
      teamFontSize -= 2;
    } while (ctx.measureText(teamsLabel).width > CANVAS_W - 120 && teamFontSize > 28);

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 10;
    ctx.fillText(teamsLabel, CANVAS_W / 2, CANVAS_H - 190);
    ctx.shadowBlur = 0;

    // Bold gold banner with date/time.
    const bannerH = 110;
    const bannerY = CANVAS_H - bannerH - 40;
    const bannerGrad = ctx.createLinearGradient(0, bannerY, CANVAS_W, bannerY);
    bannerGrad.addColorStop(0, '#fbbf24');
    bannerGrad.addColorStop(1, '#f59e0b');
    roundRect(60, bannerY, CANVAS_W - 120, bannerH, 20);
    ctx.fillStyle = bannerGrad;
    ctx.fill();

    const dateTimeLabel = [formatDateLong(date), formatTime12h(time)].filter(Boolean).join('   ·   ');
    ctx.fillStyle = NAVY;
    ctx.font = '800 46px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dateTimeLabel || 'DATE & TIME TBD', CANVAS_W / 2, bannerY + bannerH / 2 + 16);
  }, [bgImg, logoImg, date, time, fieldNumber, teamAName, teamBName]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cognihfxfc-thumbnail-${date || 'draft'}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const openPicker = async (mode: 'thumbnail' | 'link') => {
    setPickerMode(mode);
    setShowPicker(true);
    setLoadingVideos(true);
    setPushMessage(null);
    try {
      const res = await fetch('/.netlify/functions/listRecentYoutubeVideos', {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.status === 409 || data.code === 'not_connected') {
        setNeedsConnect(true);
      } else if (res.ok) {
        setNeedsConnect(false);
        setYoutubeVideos(data.videos || []);
      } else {
        setPushMessage({ text: data.error || 'Failed to load videos', ok: false });
      }
    } catch {
      setPushMessage({ text: 'Network error loading videos', ok: false });
    } finally {
      setLoadingVideos(false);
    }
  };

  const connectYoutube = async () => {
    try {
      const res = await fetch('/.netlify/functions/getYoutubeAuthUrl', {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setPushMessage({ text: data.error || 'Failed to start YouTube connection', ok: false });
      }
    } catch {
      setPushMessage({ text: 'Network error starting YouTube connection', ok: false });
    }
  };

  const applyVideoTitle = async (videoId: string): Promise<boolean> => {
    try {
      const res = await fetch('/.netlify/functions/setYoutubeVideoTitle', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ videoId, title: videoTitle.trim() }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const pushThumbnail = (videoId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selectedMatch =
      selectedMatchId === '' ? null : matches.find((m) => m.id === selectedMatchId) || null;

    if (selectedMatch?.video_url) {
      const proceed = window.confirm(
        'This match already has a video linked. Replace it with this one?'
      );
      if (!proceed) return;
    }

    setPushingVideoId(videoId);
    setPushMessage(null);
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setPushingVideoId(null);
          return;
        }
        try {
          const reader = new FileReader();
          const imageBase64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const res = await fetch('/.netlify/functions/setYoutubeThumbnail', {
            method: 'POST',
            headers: getAdminHeaders(),
            body: JSON.stringify({ videoId, imageBase64 }),
          });
          const data = await res.json();
          if (!res.ok) {
            setPushMessage({ text: data.error || 'Failed to push thumbnail', ok: false });
            return;
          }

          const results = ['Thumbnail set'];
          let allOk = true;

          if (videoTitle.trim()) {
            const titleOk = await applyVideoTitle(videoId);
            results.push(titleOk ? 'title updated' : 'title update failed');
            allOk = allOk && titleOk;
          }

          if (selectedMatch) {
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const linkRes = await fetch('/.netlify/functions/setMatchVideoUrl', {
              method: 'POST',
              headers: getAdminHeaders(),
              body: JSON.stringify({ id: selectedMatch.id, video_url: videoUrl }),
            });
            if (linkRes.ok) {
              setMatches((prev) =>
                prev.map((m) => (m.id === selectedMatch.id ? { ...m, video_url: videoUrl } : m))
              );
              results.push('linked to match');
            } else {
              results.push('linking to match failed');
              allOk = false;
            }
          } else {
            results.push('pick a match above to also save the video link');
          }

          setPushMessage({ text: `${results.join(', ')}.`, ok: allOk });
          setShowPicker(false);
        } catch {
          setPushMessage({ text: 'Network error pushing thumbnail', ok: false });
        } finally {
          setPushingVideoId(null);
        }
      },
      'image/jpeg',
      0.9
    );
  };

  const linkVideoOnly = async (videoId: string) => {
    const selectedMatch =
      selectedMatchId === '' ? null : matches.find((m) => m.id === selectedMatchId) || null;
    if (!selectedMatch) return;

    if (selectedMatch.video_url) {
      const proceed = window.confirm(
        'This match already has a video linked. Replace it with this one?'
      );
      if (!proceed) return;
    }

    setPushingVideoId(videoId);
    setPushMessage(null);
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const res = await fetch('/.netlify/functions/setMatchVideoUrl', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ id: selectedMatch.id, video_url: videoUrl }),
      });

      const results = [];
      let allOk = res.ok;
      if (res.ok) {
        setMatches((prev) =>
          prev.map((m) => (m.id === selectedMatch.id ? { ...m, video_url: videoUrl } : m))
        );
        results.push('Video linked to the match');
      } else {
        results.push('Failed to link video to the match');
      }

      if (videoTitle.trim()) {
        const titleOk = await applyVideoTitle(videoId);
        results.push(titleOk ? 'title updated' : 'title update failed');
        allOk = allOk && titleOk;
      }

      setPushMessage({ text: `${results.join(', ')}!`, ok: allOk });
      setShowPicker(false);
    } catch {
      setPushMessage({ text: 'Network error linking video', ok: false });
    } finally {
      setPushingVideoId(null);
    }
  };

  const inputCls =
    'w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none';
  const labelCls = 'block mb-1 text-sm font-bold text-gray-300';

  const sortedMatches = [...matches].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-black text-yellow-400 text-center mb-2 flex items-center justify-center gap-3">
          <ImageIcon className="w-8 h-8" /> THUMBNAIL GENERATOR
        </h1>
        <p className="text-center text-gray-400 mb-8 text-sm">
          Generate a YouTube thumbnail (1280×720) for your next live upload.
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="min-w-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 md:p-8 space-y-4 shadow-2xl">
            <div>
              <label className={labelCls}>Pick a match (most recent first)</label>
              <select
                value={selectedMatchId}
                onChange={(e) => handleSelectMatch(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputCls}
              >
                <option value="">-- Manual entry --</option>
                {sortedMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.home_team_name && m.away_team_name
                      ? `${m.home_team_name} vs ${m.away_team_name}`
                      : `Cogni HFX FC vs ${m.opponent || 'TBD'}`}{' '}
                    · {m.date}
                  </option>
                ))}
              </select>
              {selectedMatchId !== '' &&
                matches.find((m) => m.id === selectedMatchId)?.video_url && (
                  <p className="text-xs text-green-400 mt-1">✓ This match already has a video linked</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Field number</label>
              <input
                type="text"
                placeholder="e.g. 3"
                value={fieldNumber}
                onChange={(e) => setFieldNumber(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                YouTube video title{' '}
                <span className="text-gray-500 font-normal text-xs">
                  (optional — renames whichever video you push/link below)
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. Cogni HFX FC vs Bayern Munich - Jul 20, 2026"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Team A — quick pick</label>
                <select onChange={(e) => applyQuickPick('A', e.target.value)} className={inputCls} defaultValue="">
                  <option value="">-- from team list --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  className={`${inputCls} mt-2`}
                />
              </div>
              <div>
                <label className={labelCls}>Team B — quick pick</label>
                <select onChange={(e) => applyQuickPick('B', e.target.value)} className={inputCls} defaultValue="">
                  <option value="">-- from team list --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Opponent name"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  className={`${inputCls} mt-2`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={fetchNewPhoto}
              disabled={photoLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${photoLoading ? 'animate-spin' : ''}`} />
              {photoLoading ? 'Loading photo...' : 'New background photo'}
            </button>
            {photographer && (
              <p className="text-xs text-gray-500 text-center">Photo by {photographer} on Pexels</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black rounded-lg hover:scale-105 transition-all"
              >
                <Download className="w-5 h-5" /> DOWNLOAD
              </button>
              <button
                type="button"
                onClick={() => openPicker('thumbnail')}
                className="flex items-center justify-center gap-2 py-3 bg-red-600 text-white font-black rounded-lg hover:scale-105 transition-all"
              >
                <Youtube className="w-5 h-5" /> PUSH TO YOUTUBE
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() => selectedMatchId !== '' && openPicker('link')}
                disabled={selectedMatchId === ''}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700 text-white font-bold rounded-lg border border-red-600/50 hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Link2 className="w-4 h-4" /> LINK A VIDEO TO THIS MATCH (no thumbnail)
              </button>
              {selectedMatchId === '' && (
                <p className="text-xs text-gray-500 text-center mt-1">Pick a match above first</p>
              )}
            </div>

            {pushMessage && (
              <p className={`text-sm font-medium text-center ${pushMessage.ok ? 'text-green-400' : 'text-red-400'}`}>
                {pushMessage.text}
              </p>
            )}

            {showPicker && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
                {needsConnect ? (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-gray-300">
                      YouTube isn't connected yet. Authorize this app to manage thumbnails on your channel.
                    </p>
                    <button
                      type="button"
                      onClick={connectYoutube}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:scale-105 transition-all"
                    >
                      <Link2 className="w-4 h-4" /> Connect YouTube
                    </button>
                  </div>
                ) : loadingVideos ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading recent videos…</p>
                ) : youtubeVideos.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No recent videos found on the channel.</p>
                ) : (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {pickerMode === 'link'
                        ? 'Pick the video to link to this match'
                        : selectedMatchId !== ''
                          ? 'Pick the video — sets the thumbnail and links it to the match'
                          : 'Pick the video to set this thumbnail on'}
                    </p>
                    {youtubeVideos.map((v) => (
                      <div
                        key={v.videoId}
                        className="flex items-center gap-3 bg-slate-800 rounded-lg p-2 border border-slate-700"
                      >
                        {v.thumbnail && (
                          <img src={v.thumbnail} alt="" className="w-16 h-10 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{v.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(v.publishedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            pickerMode === 'link' ? linkVideoOnly(v.videoId) : pushThumbnail(v.videoId)
                          }
                          disabled={pushingVideoId !== null}
                          className="shrink-0 px-3 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:scale-105 transition-all disabled:opacity-50"
                        >
                          {pushingVideoId === v.videoId ? 'Working…' : 'Use this'}
                        </button>
                      </div>
                    ))}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="w-full text-xs text-gray-500 hover:text-gray-300 pt-1"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Live preview */}
          <div className="min-w-0 flex flex-col items-center justify-start">
            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>
            <p className="text-xs text-gray-500 mt-3">Live preview · exports at 1280×720</p>
          </div>
        </div>
      </div>
    </div>
  );
}
