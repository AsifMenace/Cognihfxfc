import React, { useEffect, useState } from "react";
import { getAdminHeaders } from "../utils/auth";
import { TeamBadge } from "../components/TeamBadge";
import { buildCrestMap, normalizeTeamName, QUICK_COMPETITIONS, ALL_COMPETITIONS } from "../utils/teamCrestMatch";

interface Team {
  id: number;
  name: string;
  color: string | null;
  logo_url?: string | null;
}

export function AddTeam() {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#000000");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [logoStatus, setLogoStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleAutoFetchLogo() {
    if (!name.trim()) {
      setLogoStatus("Enter a team name first.");
      return;
    }
    setFetchingLogo(true);
    setLogoStatus(null);
    try {
      const crestMap = await buildCrestMap(QUICK_COMPETITIONS);
      const found = crestMap.get(normalizeTeamName(name));
      if (found) {
        setLogoUrl(found);
        setLogoStatus("Found it!");
      } else {
        setLogoStatus("No crest found — you can paste a URL below instead.");
      }
    } catch {
      setLogoStatus("Lookup failed — you can paste a URL below instead.");
    } finally {
      setFetchingLogo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage({ text: "Team name is required.", ok: false });
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/addTeam", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          color: color || "#000000",
          description: description.trim(),
          logo_url: logoUrl.trim() || null,
        }),
      });

      if (res.ok) {
        setMessage({ text: "Team added successfully!", ok: true });
        setName("");
        setColor("#000000");
        setDescription("");
        setLogoUrl("");
        setLogoStatus(null);
        loadTeams();
      } else {
        const err = await res.json();
        setMessage({ text: err.error || "Failed to add team.", ok: false });
      }
    } catch {
      setMessage({ text: "An unknown error occurred.", ok: false });
    }
  }

  // ── Existing teams list — retrofit logos for teams created before this feature ──
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ done: number; total: number } | null>(null);
  const [syncSummary, setSyncSummary] = useState<{ updated: number; notFound: string[] } | null>(null);
  const [rowFetching, setRowFetching] = useState<number | null>(null);
  const [manualUrlDraft, setManualUrlDraft] = useState<{ [teamId: number]: string }>({});

  async function loadTeams() {
    setLoadingTeams(true);
    try {
      const res = await fetch("/.netlify/functions/getTeams");
      const data = await res.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch {
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);

  async function handleSyncMissingLogos() {
    setSyncing(true);
    setSyncSummary(null);
    setSyncProgress({ done: 0, total: ALL_COMPETITIONS.length });
    try {
      const teamsMissingLogo = teams.filter((t) => !t.logo_url);
      const crestMap = await buildCrestMap(ALL_COMPETITIONS, (done, total) =>
        setSyncProgress({ done, total })
      );

      let updatedCount = 0;
      const notFound: string[] = [];
      for (const team of teamsMissingLogo) {
        const found = crestMap.get(normalizeTeamName(team.name));
        if (found) {
          await saveTeamLogo(team.id, found);
          updatedCount++;
        } else {
          notFound.push(team.name);
        }
      }
      setSyncSummary({ updated: updatedCount, notFound });
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  }

  async function handleFetchForTeam(team: Team) {
    setRowFetching(team.id);
    try {
      const crestMap = await buildCrestMap(QUICK_COMPETITIONS);
      const found = crestMap.get(normalizeTeamName(team.name));
      if (found) {
        await saveTeamLogo(team.id, found);
      } else {
        setManualUrlDraft((prev) => ({ ...prev, [team.id]: prev[team.id] ?? "" }));
      }
    } finally {
      setRowFetching(null);
    }
  }

  async function saveTeamLogo(teamId: number, url: string) {
    await fetch("/.netlify/functions/updateTeamLogo", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ id: teamId, logo_url: url || null }),
    });
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, logo_url: url || null } : t)));
    setManualUrlDraft((prev) => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });
  }

  const inputCls = "w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-yellow-500 focus:outline-none";
  const labelCls = "block mb-1 text-sm font-bold text-gray-300";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <h1 className="text-3xl font-black text-yellow-400 text-center mb-8">ADD TEAM</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 md:p-8 space-y-5 shadow-2xl"
        >
          {message && (
            <p className={`text-sm font-medium ${message.ok ? "text-green-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}

          <div>
            <label className={labelCls}>Team Name</label>
            <input
              type="text"
              placeholder="e.g. Red, Blue, Cogni HFX FC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Team Color</label>
            <div className="flex items-center gap-4 p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-full cursor-pointer border-2 border-slate-500 shadow-md hover:scale-105 transition-transform"
              />
              <div>
                <p className="text-xs text-gray-400">Selected color</p>
                <p className="font-mono text-base font-bold text-white">{color.toUpperCase()}</p>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Club Logo (optional)</label>
            <div className="flex items-center gap-3 mb-2">
              {logoUrl && <TeamBadge color={color} name={name || "?"} logoUrl={logoUrl} size={40} />}
              <button
                type="button"
                onClick={handleAutoFetchLogo}
                disabled={fetchingLogo}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
              >
                {fetchingLogo ? "Searching..." : "🔍 Auto-fetch club logo"}
              </button>
            </div>
            {logoStatus && <p className="text-xs text-gray-400 mb-2">{logoStatus}</p>}
            <input
              type="text"
              placeholder="Or paste a logo URL directly"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Description (optional)</label>
            <textarea
              placeholder="Short description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} resize-none`}
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black rounded-lg hover:scale-105 transition-all"
          >
            ADD TEAM
          </button>
        </form>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 md:p-8 mt-8 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-yellow-400">EXISTING TEAMS</h2>
            <button
              type="button"
              onClick={handleSyncMissingLogos}
              disabled={syncing}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
            >
              {syncing
                ? syncProgress
                  ? `Fetching (${syncProgress.done}/${syncProgress.total})...`
                  : "Fetching..."
                : "🔄 Fetch missing logos"}
            </button>
          </div>

          {syncSummary && (
            <p className="text-sm text-gray-300 mb-4">
              Matched {syncSummary.updated} team{syncSummary.updated === 1 ? "" : "s"}.
              {syncSummary.notFound.length > 0 &&
                ` No crest found for: ${syncSummary.notFound.join(", ")}.`}
            </p>
          )}

          {loadingTeams ? (
            <p className="text-gray-400 text-sm">Loading teams...</p>
          ) : (
            <div className="space-y-2">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 p-2 bg-slate-700/40 border border-slate-600/50 rounded-lg"
                >
                  <TeamBadge color={team.color} name={team.name} logoUrl={team.logo_url} size={32} />
                  <span className="flex-1 text-white text-sm font-semibold truncate">{team.name}</span>
                  {manualUrlDraft[team.id] !== undefined ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Paste logo URL"
                        value={manualUrlDraft[team.id]}
                        onChange={(e) =>
                          setManualUrlDraft((prev) => ({ ...prev, [team.id]: e.target.value }))
                        }
                        className="px-2 py-1 bg-slate-800 text-white text-xs rounded border border-slate-600 w-40"
                      />
                      <button
                        type="button"
                        onClick={() => saveTeamLogo(team.id, manualUrlDraft[team.id])}
                        className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleFetchForTeam(team)}
                      disabled={rowFetching === team.id}
                      className="px-2 py-1 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-xs font-bold rounded"
                    >
                      {rowFetching === team.id ? "..." : team.logo_url ? "Re-fetch" : "Fetch"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
