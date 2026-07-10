// ─────────────────────────────────────────────────────────────────────────────
// AdminPanel.jsx — The Membership Committee
//
// Reads from the public.applications table (RLS-gated on profiles.is_admin).
// The approve action only flips applications.status to 'approved'; the
// auth.users row is created lazily on the applicant's first magic-link
// login by the handle_new_user trigger in migration 002.
//
// Decline is silent: the row is internally marked 'rejected', but the
// public status RPC collapses it back to 'pending' so the applicant
// never learns from the product that they were declined.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Check, X, Clock, ChevronDown, ChevronUp, RefreshCw, Shield, Mail, Settings, Eye } from "lucide-react";

import { supabase } from "../lib/supabase.js";
import {
  listApplications, decideApplication, saveInternalNote, setApplicationScore, ADMIN_STATUS,
} from "../lib/applications.js";
import { listReports, updateReportStatus } from "../lib/safety.js";
import { getSignedUrl } from "../lib/storage.js";
import { classifyMatch } from "../lib/face-match.js";
import { useAuth } from "../lib/auth-context.js";

const Label = ({ children, className = "" }) => (
  <span className={`font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a] ${className}`}>
    {children}
  </span>
);

const Rule = ({ className = "" }) => <div className={`h-px bg-[#3a352d] ${className}`} />;

const StatusPill = ({ status }) => {
  const map = {
    pending:    { label: "Pending Review", color: "text-[#a89d87] border-[#3a352d]" },
    approved:   { label: "Admitted",       color: "text-[#7aab8a] border-[#7aab8a]/40" },
    rejected:   { label: "Declined",       color: "text-[#8b5a5a] border-[#8b5a5a]/40" },
    waitlisted: { label: "Deferred",       color: "text-[#a89d87] border-[#8a7f6a]/40" },
    claimed:    { label: "Active",         color: "text-[#c4956c] border-[#c4956c]/40" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-1 border ${s.color}`}>
      {s.label}
    </span>
  );
};

const DossierCard = ({ app, onChanged, decidedBy }) => {
  const [open, setOpen] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [note, setNote] = useState(app.internal_note ?? "");
  const [noteDirty, setNoteDirty] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [score, setScore] = useState(app.score ?? "");
  const [scoreDirty, setScoreDirty] = useState(false);
  const [savingScore, setSavingScore] = useState(false);

  // Signed URLs for verification photos — short-lived, re-issued each
  // time the card is expanded. We only fetch them once the admin opens
  // the dossier so the queue list doesn't spam the storage API.
  const [faceUrl, setFaceUrl] = useState(null);
  const [passportUrl, setPassportUrl] = useState(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const [f, p] = await Promise.all([
        app.face_photo_path     ? getSignedUrl(app.face_photo_path)     : Promise.resolve(null),
        app.passport_photo_path ? getSignedUrl(app.passport_photo_path) : Promise.resolve(null),
      ]);
      if (!cancelled) {
        setFaceUrl(f);
        setPassportUrl(p);
      }
    })();
    return () => { cancelled = true; };
  }, [open, app.face_photo_path, app.passport_photo_path]);

  const decide = async (status) => {
    setDeciding(true);
    try {
      const updated = await decideApplication(app.id, status, {
        note: noteDirty ? note : undefined,
        decidedBy,
      });
      onChanged(updated);
      setNoteDirty(false);
    } catch (err) {
      alert(err.message || "Could not save decision.");
    } finally {
      setDeciding(false);
    }
  };

  const persistNote = async () => {
    setSavingNote(true);
    try {
      await saveInternalNote(app.id, note);
      setNoteDirty(false);
    } catch (err) {
      alert(err.message || "Could not save note.");
    } finally {
      setSavingNote(false);
    }
  };

  const persistScore = async () => {
    setSavingScore(true);
    try {
      const val = await setApplicationScore(app.id, score);
      onChanged({ ...app, score: val });
      setScoreDirty(false);
    } catch (err) {
      alert(err.message || "Could not save score.");
    } finally {
      setSavingScore(false);
    }
  };

  const gradients = [
    "portrait-gradient-1","portrait-gradient-2","portrait-gradient-3",
    "portrait-gradient-4","portrait-gradient-7","portrait-gradient-8",
  ];
  const grad = gradients[parseInt(app.id?.slice(-1) ?? "0", 16) % gradients.length];

  const isOpenStatus = app.status === "pending" || app.status === "waitlisted";

  return (
    <div className={`border transition-all ${
      app.status === "approved" ? "border-[#7aab8a]/30 bg-[#0e0d0b]"
      : app.status === "rejected" ? "border-[#8b5a5a]/20 bg-[#0e0d0b] opacity-60"
      : app.status === "claimed" ? "border-[#c4956c]/30 bg-[#0e0d0b]"
      : "border-[#3a352d] bg-[#0d0c0a]"
    }`}>
      <div
        className="flex items-center gap-5 p-5 cursor-pointer hover:bg-[#1a1815]/40 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className={`w-14 h-14 flex-shrink-0 ${grad} grain relative`} />

        <div className="flex-1 min-w-0">
          <div className="font-display text-lg text-[#e8e0d0]">
            {app.first_name ?? "—"}
            {app.age && <span className="text-[#8a7f6a] font-light">, {app.age}</span>}
          </div>
          <div className="font-mono text-[10px] text-[#5a5349] uppercase tracking-[0.18em] truncate mt-0.5 flex items-center gap-2">
            <Mail size={9} />
            <span className="truncate">{app.email}</span>
            <span className="text-[#3a352d]">·</span>
            <span>{[app.occupation, app.city].filter(Boolean).join(" · ") || "—"}</span>
          </div>
        </div>

        <StatusPill status={app.status ?? "pending"} />
        {open ? <ChevronUp size={14} className="text-[#5a5349]" /> : <ChevronDown size={14} className="text-[#5a5349]" />}
      </div>

      {open && (
        <div className="border-t border-[#3a352d] p-5 space-y-6 animate-fade-up">

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="block">Dossier</Label>
              {[
                ["Email",        app.email],
                ["Role",         app.profession || app.occupation || "—"],
                ["Company",      app.company || "—"],
                ["Experience",   app.years_experience != null ? `${app.years_experience} yrs` : "—"],
                ["LinkedIn",     app.linkedin_url ? <a href={app.linkedin_url} target="_blank" rel="noreferrer" className="text-[#c4956c] hover:underline break-all">{app.linkedin_url}</a> : "—"],
                ["Education",    app.school && app.degree ? `${app.degree}, ${app.school}` : (app.school || app.degree || "—")],
                ["Link",         app.link ? <a href={app.link} target="_blank" rel="noreferrer" className="text-[#c4956c] hover:underline">{app.link}</a> : "—"],
                ["Applied",      app.created_at ? new Date(app.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"],
                ["Decided",      app.decided_at ? new Date(app.decided_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <Label>{label}</Label>
                  <div className="font-display text-sm text-[#e8e0d0] mt-0.5 break-words">{value}</div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {app.bio && (
                <div>
                  <Label>Biography</Label>
                  <p className="font-display italic text-[#a89d87] text-sm leading-relaxed mt-1">"{app.bio}"</p>
                </div>
              )}

              {app.why && (
                <div>
                  <Label>Why kbridge</Label>
                  <p className="font-display text-[#e8e0d0] text-sm leading-relaxed mt-1 whitespace-pre-wrap">{app.why}</p>
                </div>
              )}

              <div>
                <Label>Internal note (admin-only)</Label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={e => { setNote(e.target.value); setNoteDirty(true); }}
                  placeholder="Notes for the committee. Never shown to the applicant."
                  className="w-full mt-2 bg-[#1a1815] border border-[#3a352d] p-3 text-[#e8e0d0] font-mono text-xs leading-relaxed placeholder:text-[#3a352d] focus:outline-none focus:border-[#c4956c] resize-none"
                />
                {noteDirty && (
                  <button
                    onClick={persistNote}
                    disabled={savingNote}
                    className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#c4956c] border border-[#c4956c]/40 px-3 py-1.5 hover:bg-[#c4956c]/10 disabled:opacity-40"
                  >
                    {savingNote ? "Saving…" : "Save note"}
                  </button>
                )}
              </div>

              <div>
                <Label>Ranking · 1–10</Label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={score}
                    onChange={e => { setScore(e.target.value); setScoreDirty(true); }}
                    placeholder="—"
                    className="w-24 bg-[#1a1815] border border-[#3a352d] p-2 text-[#e8e0d0] font-mono text-sm focus:outline-none focus:border-[#c4956c]"
                  />
                  {scoreDirty && (
                    <button
                      onClick={persistScore}
                      disabled={savingScore}
                      className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#c4956c] border border-[#c4956c]/40 px-3 py-1.5 hover:bg-[#c4956c]/10 disabled:opacity-40"
                    >
                      {savingScore ? "Saving…" : "Save score"}
                    </button>
                  )}
                </div>
                <p className="font-mono text-[9px] text-[#5a5349] mt-1 tracking-[0.14em]">
                  Members only match within ±2.5 of this. Score at admission.
                </p>
              </div>
            </div>
          </div>

          {/* Verification photos — signed URLs, click to open full size */}
          {(app.face_photo_path || app.passport_photo_path) && (
            <>
              <Rule />
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <Label className="block">Identity verification</Label>
                  {(() => {
                    const fm = app.payload?.face_match;
                    if (!fm) return null;
                    const v = classifyMatch(fm.distance);
                    return (
                      <span
                        className="font-mono text-[10px] uppercase tracking-[0.22em] border px-2 py-1"
                        style={{ color: v.color, borderColor: `${v.color}66` }}
                        title={fm.distance != null ? `Euclidean distance ${fm.distance.toFixed(3)} (lower = more similar)` : fm.error ?? ""}
                      >
                        {v.label}
                        {fm.distance != null && (
                          <span className="text-[#5a5349] ml-2 font-normal">
                            {fm.distance.toFixed(2)}
                          </span>
                        )}
                      </span>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Face photo", faceUrl, app.face_photo_path],
                    ["US passport", passportUrl, app.passport_photo_path],
                  ].map(([label, url, path]) => (
                    <div key={label} className="space-y-2">
                      <Label className="!text-[#5a5349]">{label}</Label>
                      {path ? (
                        url ? (
                          <a href={url} target="_blank" rel="noreferrer" className="block border border-[#3a352d] hover:border-[#c4956c] transition-colors aspect-[4/3] bg-[#1a1410] overflow-hidden relative group">
                            <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-[#0e0d0b]/0 group-hover:bg-[#0e0d0b]/40 transition-colors flex items-center justify-center">
                              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#e8e0d0] opacity-0 group-hover:opacity-100 transition-opacity">Open full ↗</span>
                            </div>
                          </a>
                        ) : (
                          <div className="border border-[#3a352d] aspect-[4/3] bg-[#1a1410] flex items-center justify-center">
                            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5a5349]">Loading…</span>
                          </div>
                        )
                      ) : (
                        <div className="border border-dashed border-[#3a352d] aspect-[4/3] bg-[#0a0908] flex items-center justify-center">
                          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5a5349]">Not provided</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#5a5349]">
                  Signed URLs expire after 5 minutes — close and reopen to refresh.
                </p>
              </div>
            </>
          )}

          <Rule />

          {isOpenStatus && (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => decide("waitlisted")}
                disabled={deciding}
                className="font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 border border-[#5a5349] text-[#8a7f6a] hover:border-[#a89d87] hover:text-[#a89d87] transition-colors disabled:opacity-40"
              >
                <Clock size={11} className="inline mr-1" /> Defer
              </button>
              <button
                onClick={() => decide("rejected")}
                disabled={deciding}
                className="font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 border border-[#8b5a5a]/50 text-[#8b5a5a] hover:bg-[#8b5a5a]/10 transition-colors disabled:opacity-40"
                title="Silent decline — applicant won't be notified."
              >
                <X size={11} className="inline mr-1" /> Decline (silent)
              </button>
              <button
                onClick={() => decide("approved")}
                disabled={deciding}
                className="font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 border border-[#c4956c]/60 text-[#c4956c] hover:bg-[#c4956c]/10 transition-colors disabled:opacity-40"
              >
                <Check size={11} className="inline mr-1" /> Admit
              </button>
            </div>
          )}

          {(app.status === "approved" || app.status === "rejected" || app.status === "claimed") && (
            <div className="flex items-center justify-between">
              <StatusPill status={app.status} />
              {app.status !== "claimed" && (
                <button
                  onClick={() => decide("pending")}
                  className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5a5349] hover:text-[#8a7f6a] underline"
                >
                  Reopen
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const REPORT_STATUS_COLOR = {
  open:      "text-[#d4928f] border-[#8b5a5a]/40",
  reviewed:  "text-[#a89d87] border-[#3a352d]",
  actioned:  "text-[#7aab8a] border-[#7aab8a]/40",
  dismissed: "text-[#5a5349] border-[#3a352d]",
};

const ReportsPanel = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setReports(await listReports()); }
    catch (e) { alert(e.message || "Could not load reports."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    try {
      const u = await updateReportStatus(id, status);
      setReports(rs => rs.map(r => r.id === id ? { ...r, status: u.status } : r));
    } catch (e) { alert(e.message || "Could not update report."); }
  };

  if (loading) return <div className="text-center py-20"><Label>Loading reports…</Label></div>;
  if (reports.length === 0) return (
    <div className="text-center py-20 space-y-3">
      <div className="font-display text-3xl italic text-[#c4956c]">Nothing reported.</div>
      <Label>The community is quiet.</Label>
    </div>
  );

  return (
    <div className="space-y-3">
      {reports.map(r => (
        <div key={r.id} className="border border-[#3a352d] bg-[#0d0c0a] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-display text-lg text-[#e8e0d0]">{r.reason}</div>
              <div className="font-mono text-[10px] text-[#5a5349] uppercase tracking-[0.18em] mt-1">
                {(r.reported?.first_name || "—")} {r.reported?.member_number || ""} · reported by {(r.reporter?.first_name || "—")}
              </div>
              <div className="font-mono text-[9px] text-[#5a5349] mt-1">
                {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
              </div>
            </div>
            <span className={`font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-1 border ${REPORT_STATUS_COLOR[r.status] || REPORT_STATUS_COLOR.open}`}>
              {r.status}
            </span>
          </div>
          {r.detail && <p className="font-display italic text-[#a89d87] text-sm mt-3 leading-relaxed">"{r.detail}"</p>}
          <div className="flex items-center gap-2 mt-4">
            {["reviewed", "actioned", "dismissed"].map(s => (
              <button
                key={s}
                onClick={() => setStatus(r.id, s)}
                disabled={r.status === s}
                className="font-mono text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 border border-[#3a352d] text-[#8a7f6a] hover:border-[#c4956c] hover:text-[#c4956c] disabled:opacity-30"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function AdminPanel() {
  const navigate = useNavigate();
  // AuthProvider already owns the session + profile, so just consume it
  // here. Doing a second fetch was both wasteful and a hang-risk: the
  // old IIFE had no try/catch, so any error left "Authenticating…"
  // showing forever.
  const { user, profile, loading: authLoading, setAdminAsMember } = useAuth();
  const me = user;
  const isAdmin = !!profile?.is_admin;

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(ADMIN_STATUS.PENDING);
  const [searchQuery, setSearchQuery] = useState("");

  const enterMemberView = () => {
    setAdminAsMember(true);
    navigate("/discover");
  };

  const load = async () => {
    if (filter === "reports") return; // ReportsPanel loads its own data
    setLoading(true);
    try {
      const rows = await listApplications({ status: filter });
      setApps(rows);
    } catch (err) {
      alert(err.message || "Could not load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) load();
  }, [filter, authLoading, isAdmin]);

  const handleChanged = (updated) => {
    setApps(prev => {
      const stillMatches = filter === updated.status;
      if (!stillMatches) return prev.filter(a => a.id !== updated.id);
      return prev.map(a => a.id === updated.id ? updated : a);
    });
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return apps;
    const q = searchQuery.toLowerCase();
    return apps.filter(a =>
      a.first_name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q) ||
      a.occupation?.toLowerCase().includes(q) ||
      (a.communities ?? []).join(" ").toLowerCase().includes(q)
    );
  }, [apps, searchQuery]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0e0d0b] flex items-center justify-center">
        <Label>Authenticating…</Label>
      </div>
    );
  }
  if (!me || !profile) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const tabs = [
    [ADMIN_STATUS.PENDING,    "Pending"],
    [ADMIN_STATUS.WAITLISTED, "Deferred"],
    [ADMIN_STATUS.APPROVED,   "Admitted"],
    [ADMIN_STATUS.CLAIMED,    "Active"],
    [ADMIN_STATUS.REJECTED,   "Declined"],
    ["reports",               "Reports"],
  ];

  return (
    <div className="min-h-screen bg-[#0e0d0b]">
      <div className="border-b border-[#3a352d] bg-[#0a0908]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Shield size={14} className="text-[#c4956c]" />
                <Label>The Membership Committee</Label>
              </div>
              <h1 className="font-display text-3xl italic text-[#e8e0d0]">
                Application <em className="text-[#c4956c]">Review</em>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={enterMemberView}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5a5349] hover:text-[#c4956c] border border-[#3a352d] hover:border-[#c4956c]/40 px-3 py-2"
                title="Temporarily view the app as a regular member."
              >
                <Eye size={10} className="inline mr-1" /> View as member
              </button>
              <Link
                to="/settings"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5a5349] hover:text-[#8a7f6a] border border-[#3a352d] px-3 py-2 inline-flex items-center"
              >
                <Settings size={10} className="inline mr-1" /> Settings
              </Link>
              <button onClick={load} className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5a5349] hover:text-[#8a7f6a] border border-[#3a352d] px-3 py-2">
                <RefreshCw size={10} className="inline mr-1" /> Refresh
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 flex-wrap">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border transition-colors ${
                  filter === key
                    ? "border-[#c4956c]/60 text-[#c4956c] bg-[#c4956c]/05"
                    : "border-[#3a352d] text-[#5a5349] hover:text-[#8a7f6a]"
                }`}
              >
                {label}
              </button>
            ))}
            <input
              type="text"
              placeholder="Search name, email, city…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="ml-auto bg-transparent border-b border-[#3a352d] pb-1 font-mono text-[11px] text-[#e8e0d0] placeholder:text-[#3a352d] focus:outline-none focus:border-[#c4956c] w-64"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {filter === "reports" ? (
          <ReportsPanel/>
        ) : loading ? (
          <div className="text-center py-20"><Label>Loading applications…</Label></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="font-display text-3xl italic text-[#c4956c]">The queue is clear.</div>
            <Label>No {filter} applications at this time.</Label>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => (
              <DossierCard
                key={a.id}
                app={a}
                onChanged={handleChanged}
                decidedBy={me?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
