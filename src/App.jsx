import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, Link } from "react-router-dom";
import {
  ArrowRight, ArrowLeft, Check, X, Heart, MessageCircle,
  User, Shield, GraduationCap, Camera, Sparkles, Send,
  LogOut, Award, MapPin, Crown, Lock, ChevronRight, Upload,
  Calendar, Copy, CheckCheck, AlertCircle, Ticket, Settings,
  Bell, Trash2, KeyRound, ChevronDown,
} from "lucide-react";
import AdminPanel from "./components/AdminPanel.jsx";
import { AuthContext, useAuth } from "./lib/auth-context.js";
import Apply from "./routes/Apply.jsx";
import ApplicationStatus from "./routes/ApplicationStatus.jsx";
import Signup from "./routes/Signup.jsx";
import Login from "./routes/Login.jsx";
import AuthCallback from "./routes/AuthCallback.jsx";
import Legal from "./routes/Legal.jsx";
import { supabase } from "./lib/supabase.js";
import { TIERS, canSendIntro, canSendInvite, canAccessEvents } from "./lib/tiers.js";
import { displayProfile } from "./lib/profile.js";
import {
  listCorrespondences, getCorrespondence, sendMessage as sendChatMessage,
  markCorrespondenceRead, subscribeToCorrespondence, subscribeToInbox,
} from "./lib/chat.js";
import {
  INTRO_NOTE_LIMITS, validateIntroNote, createIntroductionRequest,
  listIncomingRequests, acceptIntroductionRequest, declineIntroductionRequest,
  subscribeToIncomingRequests,
} from "./lib/introductions.js";

// ── Fonts ─────────────────────────────────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,600&family=JetBrains+Mono:wght@300;400;500&display=swap');
    *{box-sizing:border-box;}
    .font-display{font-family:'Fraunces','Times New Roman',serif;font-optical-sizing:auto;}
    .font-mono{font-family:'JetBrains Mono',monospace;}
    .editorial-rule{background:linear-gradient(90deg,transparent,#3a352d 20%,#3a352d 80%,transparent);}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
    @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(196,149,108,0)}50%{box-shadow:0 0 30px 2px rgba(196,149,108,.15)}}
    @keyframes typing{0%{opacity:.3}50%{opacity:1}100%{opacity:.3}}
    .animate-fade-up{animation:fadeUp .5s ease-out both;}
    .animate-slide-in{animation:slideIn .4s ease-out both;}
    .typing-dot{animation:typing 1.4s infinite;}
    .typing-dot:nth-child(2){animation-delay:.2s}
    .typing-dot:nth-child(3){animation-delay:.4s}
    .grain::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.08;
      background-image:
        radial-gradient(circle at 20% 20%, rgba(255,255,255,.08) 0 0.6px, transparent 0.8px),
        radial-gradient(circle at 80% 30%, rgba(255,255,255,.05) 0 0.7px, transparent 0.9px),
        radial-gradient(circle at 40% 70%, rgba(255,255,255,.06) 0 0.6px, transparent 0.8px);
      background-size:18px 18px, 24px 24px, 22px 22px;
      background-position:0 0, 7px 11px, 13px 5px;}
    .card-shadow{box-shadow:0 20px 60px -20px rgba(0,0,0,.6),0 0 0 1px rgba(232,224,208,.06);}
    .portrait-gradient-1{background:linear-gradient(135deg,#3d2817,#6b4423 40%,#8b6d47)}
    .portrait-gradient-2{background:linear-gradient(135deg,#2d3a2d,#4a5d3a 50%,#7a8a6a)}
    .portrait-gradient-3{background:linear-gradient(135deg,#4a2d2d,#6b3a3a 50%,#8b5a5a)}
    .portrait-gradient-4{background:linear-gradient(135deg,#2d2d4a,#3a3a6b 50%,#5a5a8b)}
    .portrait-gradient-5{background:linear-gradient(135deg,#3d2d4a,#5a3a6b 50%,#8b6aa8)}
    .portrait-gradient-6{background:linear-gradient(135deg,#4a3a2d,#6b5a3a 50%,#a88a5a)}
    .portrait-gradient-7{background:linear-gradient(135deg,#1e2a3a,#2a4055 50%,#4a6d8a)}
    .portrait-gradient-8{background:linear-gradient(135deg,#3a1e2a,#55283a 50%,#8a4a6b)}
    input,textarea,select{font-family:'Fraunces',serif;}
    input:focus,textarea:focus,select:focus{outline:none;}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#3a352d}
    html,body,#root{margin:0;padding:0;background:#0e0d0b;min-height:100vh;}
  `}</style>
);

// ── Auth Context ──────────────────────────────────────────────────────────────
// AuthContext + useAuth are imported at the top of this file from
// lib/auth-context.js to avoid a circular import with components that
// consume the context (e.g. AdminPanel). AuthProvider stays in this file.

const MOCK_EVENTS = [
  {id:"e1",title:"Founding Member Dinner — Spring",description:"An intimate dinner for Founding members. Seven courses, four cities, one evening.",city:"New York",     event_date:"2026-05-06T19:30:00Z",capacity:24},
  {id:"e2",title:"Members' Gallery Evening",       description:"Private after-hours access to a member-curated exhibition, followed by a reception.",city:"Los Angeles", event_date:"2026-05-13T18:00:00Z",capacity:40},
  {id:"e3",title:"Conversation Series: Vol. III",  description:"An off-record conversation with three members on careers, ambition, and time.",city:"San Francisco",event_date:"2026-05-20T19:00:00Z",capacity:32},
];

// ── Shared state for matches/threads (lifted here so it persists across routes) ─
const AppStateContext = createContext(null);
export const useAppState = () => useContext(AppStateContext);

// ── Primitives ────────────────────────────────────────────────────────────────
const Label = ({children,className=""}) => (
  <span className={`font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a] ${className}`}>{children}</span>
);
const Rule = ({className=""}) => <div className={`h-px editorial-rule ${className}`}/>;

const Btn = ({children,onClick,variant="primary",className="",disabled=false,type="button"}) => {
  const base="font-mono text-[11px] uppercase tracking-[0.22em] px-7 py-4 transition-all duration-300 inline-flex items-center justify-center gap-2";
  const v={
    primary:"bg-[#c4956c] text-[#0e0d0b] hover:bg-[#d4a47c]",
    ghost:"border border-[#3a352d] text-[#e8e0d0] hover:border-[#c4956c] hover:text-[#c4956c]",
    outline:"border border-[#c4956c] text-[#c4956c] hover:bg-[#c4956c] hover:text-[#0e0d0b]",
    danger:"border border-[#8b5a5a]/60 text-[#d4928f] hover:bg-[#8b5a5a]/20",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${v[variant]} ${disabled?"opacity-40 cursor-not-allowed":"cursor-pointer"} ${className}`}>{children}</button>;
};

const TextField = ({label,value,onChange,placeholder,type="text",autoComplete=""}) => (
  <div className="space-y-2">
    {label&&<Label>{label}</Label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete}
      className="w-full bg-transparent border-b border-[#3a352d] pb-3 text-[#e8e0d0] font-display text-lg placeholder:text-[#5a5349] focus:border-[#c4956c] transition-colors"/>
  </div>
);

const Portrait = ({profile,size="full"}) => {
  const sizes={full:"aspect-[3/4]",square:"aspect-square",thumb:"w-12 h-12"};
  const p = profile || {};
  return (
    <div className={`${sizes[size]} ${p.gradient||"portrait-gradient-7"} grain relative overflow-hidden flex items-center justify-center`}>
      <span className="font-display italic text-[#e8e0d0]/40" style={{fontSize:size==="thumb"?"1rem":"6rem",letterSpacing:"-0.02em"}}>{p.initials||"?"}</span>
      {size==="full"&&<div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0b] via-[#0e0d0b]/40 to-transparent"/>}
    </div>
  );
};

// ── Top Navbar ────────────────────────────────────────────────────────────────
const Navbar = ({title, showBack=false, backTo, actions}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <div className="border-b border-[#3a352d] bg-[#0e0d0b] px-5 py-4 flex items-center justify-between flex-shrink-0 z-20">
      {/* Left */}
      <div className="w-24 flex items-center">
        {showBack ? (
          <button onClick={handleBack} className="flex items-center gap-2 text-[#8a7f6a] hover:text-[#e8e0d0] transition-colors">
            <ArrowLeft size={16}/>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Back</span>
          </button>
        ) : (
          <Link to="/discover" className="font-display text-xl">
            kbridge<span className="italic text-[#c4956c]">.</span>
          </Link>
        )}
      </div>

      {/* Center */}
      <div className="flex-1 text-center">
        {title && <Label>{title}</Label>}
      </div>

      {/* Right */}
      <div className="w-24 flex items-center justify-end gap-3">
        {actions || (
          <Link to="/settings" className="text-[#8a7f6a] hover:text-[#c4956c] transition-colors">
            <Settings size={17}/>
          </Link>
        )}
      </div>
    </div>
  );
};

// ── Bottom Tab Bar ────────────────────────────────────────────────────────────
const TabBar = ({profile}) => {
  const location = useLocation();
  const canEvents = canAccessEvents(profile||{tier:"observer"});
  const appState = useContext(AppStateContext);
  const incomingCount = appState?.incomingCount || 0;

  const tabs = [
    {path:"/discover",       icon:Sparkles,      label:"Discover"},
    {path:"/introductions",  icon:Bell,          label:"Introductions", badge:incomingCount},
    {path:"/correspondence", icon:MessageCircle, label:"Threads"},
    {path:"/events",         icon:Calendar,      label:"Events",        locked:!canEvents.allowed},
    {path:"/profile",        icon:User,          label:"Profile"},
  ];

  return (
    <div className="border-t border-[#3a352d] flex bg-[#0e0d0b] flex-shrink-0">
      {tabs.map(t=>(
        <Link key={t.path} to={t.path}
          className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all ${location.pathname.startsWith(t.path)?"text-[#c4956c]":"text-[#5a5349] hover:text-[#8a7f6a]"}`}>
          <div className="relative">
            <t.icon size={18}/>
            {t.locked && <Lock size={8} className="absolute -top-1 -right-1 text-[#5a5349]"/>}
            {!t.locked && t.badge>0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#c4956c] text-[#0e0d0b] font-mono text-[8px] tracking-[0.1em] px-1 min-w-[14px] h-[14px] flex items-center justify-center leading-none">
                {t.badge>9?"9+":t.badge}
              </span>
            )}
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.22em]">{t.label}</span>
        </Link>
      ))}
    </div>
  );
};

// ── App Shell (wraps all authenticated routes) ────────────────────────────────
const AppShell = ({children, navTitle, showBack=false, backTo, navActions, hideTabBar=false}) => {
  const {profile} = useAuth();
  return (
    <div className="min-h-screen bg-[#0e0d0b] text-[#e8e0d0] grain relative flex flex-col">
      <FontLoader/>
      <Navbar title={navTitle} showBack={showBack} backTo={backTo} actions={navActions}/>
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
      {!hideTabBar && <TabBar profile={profile}/>}
    </div>
  );
};

// ── Tier Upgrade Modal ────────────────────────────────────────────────────────
const TierUpgradeModal = ({reason,upgradeRequired,onClose,onUpgrade}) => {
  const tier=TIERS[upgradeRequired]??TIERS.member;
  return (
    <div className="fixed inset-0 bg-[#0e0d0b]/90 z-50 flex items-end sm:items-center justify-center p-6">
      <div className="bg-[#1a1815] border border-[#3a352d] w-full max-w-md card-shadow p-8 animate-fade-up">
        <div className="flex items-start gap-3 mb-6">
          <Lock size={18} className="text-[#c4956c] flex-shrink-0 mt-1"/>
          <div><div className="font-display text-2xl">Upgrade required</div><p className="text-[#a89d87] text-sm mt-1 leading-relaxed">{reason}</p></div>
        </div>
        <div className="border border-[#c4956c]/30 bg-[#c4956c]/5 p-5 mb-6">
          <div className="flex items-baseline gap-3"><span className="font-display text-xl">{tier.name}</span>{tier.key==="founding"&&<Crown size={14} className="text-[#c4956c]"/>}</div>
          <div className="flex items-baseline gap-2 mt-1 mb-4"><span className="font-display italic text-2xl text-[#c4956c]">{tier.price}</span><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a7f6a]">{tier.priceMeta}</span></div>
          <ul className="space-y-2">{tier.features.map(f=><li key={f} className="flex gap-2 text-sm text-[#a89d87]"><span className="text-[#c4956c]">·</span>{f}</li>)}</ul>
        </div>
        <div className="flex flex-col gap-3">
          <Btn variant="primary" onClick={()=>onUpgrade(upgradeRequired)}>Upgrade to {tier.name} <ArrowRight size={14}/></Btn>
          <Btn variant="ghost" onClick={onClose}>Not now</Btn>
        </div>
      </div>
    </div>
  );
};

// ── Introduction-note sheet ───────────────────────────────────────────────────
// Opens when a member taps "Request Introduction" on a dossier. The
// requester writes a short, specific note. Recipient will read it
// before accepting.
const IntroNoteSheet = ({recipient,onClose,onSubmitted}) => {
  const {user} = useAuth();
  const [note,setNote] = useState("");
  const [submitting,setSubmitting] = useState(false);
  const [error,setError] = useState(null);
  const len = note.trim().length;
  const valid = validateIntroNote(note);

  const handleSubmit = async () => {
    setError(null);
    if(!valid.ok) { setError(valid.reason); return; }
    setSubmitting(true);
    try {
      await createIntroductionRequest(user.id, recipient.id, note);
      onSubmitted(recipient);
    } catch (e) {
      console.error("createIntroductionRequest", e);
      const msg = (e?.message||"").includes("duplicate")
        ? "You've already sent an introduction to this member."
        : (e?.message || "Couldn't send the introduction. Try again.");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0e0d0b]/95 z-50 flex items-end sm:items-center justify-center p-6 animate-fade-up">
      <div className="bg-[#1a1815] border border-[#3a352d] w-full max-w-md card-shadow p-7">
        <Label className="text-[#c4956c]">A Note of Introduction</Label>
        <h2 className="font-display text-3xl italic text-[#e8e0d0] mt-2 leading-tight">To {recipient.name}.</h2>
        <p className="font-display text-[14px] text-[#a89d87] mt-3 leading-relaxed">
          A few sentences, specific to {recipient.name}. They'll read this before deciding.
        </p>

        <div className="mt-6">
          <textarea
            value={note}
            onChange={e=>setNote(e.target.value)}
            rows={6}
            placeholder="Something true. Specific. Not a pickup line."
            className="w-full bg-transparent border-b border-[#3a352d] focus:border-[#c4956c] transition-colors pb-3 text-[#e8e0d0] font-display text-[15px] leading-[1.6] placeholder:text-[#5a5349] resize-none"
            maxLength={INTRO_NOTE_LIMITS.max}
            autoFocus
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${len < INTRO_NOTE_LIMITS.min ? "text-[#5a5349]" : "text-[#c4956c]"}`}>
              {len < INTRO_NOTE_LIMITS.min
                ? `${INTRO_NOTE_LIMITS.min - len} more characters`
                : `${len} / ${INTRO_NOTE_LIMITS.max}`}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 border border-[#8b5a5a]/50 bg-[#8b5a5a]/10 px-4 py-3">
            <p className="font-display text-[13px] text-[#d4928f]">{error}</p>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3">
          <Btn variant="primary" onClick={handleSubmit} disabled={!valid.ok || submitting}>
            {submitting ? "Sending…" : "Send introduction"}
          </Btn>
          <Btn variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
};

const RequestSentModal = ({recipient,onClose,onViewInbox}) => (
  <div className="fixed inset-0 bg-[#0e0d0b]/95 z-50 flex items-center justify-center p-8 animate-fade-up">
    <div className="max-w-md text-center">
      <Label className="text-[#c4956c]">Sent</Label>
      <h2 className="font-display text-5xl italic text-[#c4956c] mt-4 leading-tight">Your note<br/>is on its way.</h2>
      <p className="font-display text-lg text-[#a89d87] mt-6 italic">
        {recipient.name} will read your introduction and respond when they're ready.
      </p>
      <div className="flex justify-center gap-4 mt-10">
        <div className="w-32 h-40 overflow-hidden"><Portrait profile={recipient}/></div>
      </div>
      <div className="mt-12 flex flex-col gap-3">
        <Btn variant="primary" onClick={onViewInbox}><MessageCircle size={14}/> View introductions</Btn>
        <Btn variant="ghost" onClick={onClose}>Continue browsing</Btn>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────────────────────────────────────

// ── Landing ───────────────────────────────────────────────────────────────────
// Editorial / magazine direction. Bento composition, asymmetric grid,
// duotone photography (picsum seeds — swap to your own images by changing
// the `src` strings). Drop cap on the opening paragraph. Pull quote that
// escapes its column. A right-margin "Marginalia" sidebar acting as the
// scannable details strip. Footer is a colophon, not a copyright line.
const Landing = () => {
  const navigate = useNavigate();
  const {user,profile,loading: authLoading} = useAuth();
  const signedIn = !!user;
  const memberFirstName = profile?.first_name || "Member";
  const memberLanding = profile?.onboarding_complete ? "/discover" : "/apply";

  // Duotone treatment: grayscale + warm overlay. Swap these picsum URLs
  // for your own photography once you have it. The seed keeps the same
  // image across reloads.
  const heroImg = "https://picsum.photos/seed/kbridge-hero-2/900/1200.jpg";
  const detailImg = "https://picsum.photos/seed/kbridge-still-3/600/420.jpg";

  return (
    <div className="min-h-screen bg-[#0e0d0b] text-[#e8e0d0] grain relative overflow-hidden">
      <FontLoader/>
      <style>{`
        .duotone {
          filter: grayscale(100%) contrast(105%) brightness(85%);
        }
        .duotone-tint {
          background: linear-gradient(180deg, rgba(196,149,108,0.30), rgba(46,29,17,0.55));
          mix-blend-mode: color;
        }
        .dropcap::first-letter {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 5.2rem;
          line-height: 0.85;
          float: left;
          padding: 0.4rem 0.7rem 0 0;
          color: #c4956c;
        }
        .pullquote-mark {
          font-family: 'Fraunces', serif;
          font-style: italic;
          color: #c4956c;
          line-height: 0.5;
        }
      `}</style>

      {/* ── Masthead ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-6">
        <div className="flex items-baseline justify-between">
          <div className="font-display text-2xl tracking-tight">
            kbridge<span className="italic text-[#c4956c]">.</span>
          </div>
          <div className="hidden sm:flex items-baseline gap-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#5a5349]">
              Issue 01 · Spring 2026
            </span>
            {authLoading ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#5a5349]">···</span>
            ) : signedIn ? (
              <button
                onClick={()=>navigate(memberLanding)}
                className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#c4956c] hover:text-[#d4a47c] flex items-baseline gap-2"
                aria-label={`Signed in as ${memberFirstName}`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#c4956c]"/>
                Signed in · {memberFirstName} →
              </button>
            ) : (
              <>
                <button
                  onClick={()=>navigate("/apply")}
                  className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#e8e0d0] hover:text-[#c4956c]"
                >
                  Apply
                </button>
                <button
                  onClick={()=>navigate("/login")}
                  className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a7f6a] hover:text-[#c4956c]"
                >
                  Sign in →
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mt-6 h-px bg-[#3a352d]"/>
      </div>

      {/* ── Editorial bento hero ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 mt-14 sm:mt-20">
        <div className="grid grid-cols-12 gap-x-6 gap-y-14">

          {/* Eyebrow + headline (off-center, breaks 12-col into 7+5) */}
          <div className="col-span-12 lg:col-span-7 lg:col-start-1 animate-fade-up">
            <div className="flex items-center gap-3 mb-10">
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#8a7f6a]">
                A note from the committee
              </span>
              <span className="flex-1 h-px bg-[#3a352d]"/>
              <span className="font-mono text-[10px] text-[#5a5349]">№ 01</span>
            </div>
            <h1 className="font-display leading-[0.88] tracking-[-0.02em]"
                style={{ fontSize: "clamp(3.25rem, 8.5vw, 8.5rem)" }}>
              The room is
              <br/>
              <span className="italic text-[#c4956c]">small</span> on purpose.
            </h1>
          </div>

          {/* Duotone portrait, intentionally tall and offset down */}
          <div className="col-span-12 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:mt-24 animate-fade-up">
            <figure className="relative">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#1a1410] card-shadow">
                <img
                  src={heroImg}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover duotone"
                  loading="eager"
                />
                <div className="absolute inset-0 duotone-tint pointer-events-none"/>
                <div className="absolute inset-0 grain pointer-events-none"/>
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0e0d0b] via-[#0e0d0b]/40 to-transparent"/>
              </div>
              <figcaption className="mt-3 flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#5a5349]">
                  Pl. I — Reading room
                </span>
                <span className="font-mono text-[10px] text-[#5a5349]">
                  Brooklyn, March
                </span>
              </figcaption>
            </figure>
          </div>

          {/* Opening paragraph with drop cap, narrower column on purpose */}
          <div className="col-span-12 lg:col-span-7 lg:col-start-1 animate-fade-up">
            <p className="dropcap font-display text-xl md:text-[1.45rem] leading-[1.55] text-[#e0d6c4] max-w-[44ch]">
              I started this because the apps got worse, because the parties got bigger,
              because the friend-of-a-friend introduction has, somewhere along the way,
              been replaced by an algorithm. kbridge is a small correction — three or
              four hundred people, hand-read applications, dinners every other Tuesday.
              It is, mostly, an experiment.
            </p>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8a7f6a]">
              — David, founder
            </p>

            {/* Primary action lives under the letter, not in the hero. */}
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3">
              <button
                onClick={()=>navigate("/apply")}
                className="group relative font-mono text-[11px] uppercase tracking-[0.32em] text-[#c4956c] py-3"
              >
                Apply to join
                <span className="block absolute left-0 right-0 -bottom-0.5 h-px bg-[#c4956c] origin-left scale-x-100 group-hover:scale-x-[1.08] transition-transform"/>
              </button>
              <span className="font-mono text-[10px] text-[#5a5349]">
                Next review: first Tuesday of next month
              </span>
            </div>
          </div>

          {/* Marginalia sidebar — small, dense, scannable */}
          <aside className="col-span-12 lg:col-span-4 lg:col-start-9 lg:mt-8">
            <div className="border-l border-[#3a352d] pl-5 sm:pl-7 space-y-7 max-w-xs">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#5a5349]">
                  Marginalia
                </div>
                <div className="mt-3 h-px w-12 bg-[#c4956c]/40"/>
              </div>

              {[
                ["What we read", "Every application, by hand, the week it arrives."],
                ["What we don't", "Photos before the rest of the application. Anyone in marketing."],
                ["When we meet", "Tuesdays, every other week. Six people. One table."],
                ["What it costs", "Nothing for the first year. We'll figure the rest out together."],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#c4956c]">{k}</div>
                  <div className="font-display text-[15px] text-[#e8e0d0] mt-1 leading-snug">{v}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {/* ── Pull quote that escapes the column ───────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 mt-28 sm:mt-40">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-10 lg:col-start-2 relative">
            <span
              aria-hidden="true"
              className="pullquote-mark absolute -left-2 -top-10 select-none"
              style={{ fontSize: "9rem" }}
            >
              "
            </span>
            <p
              className="font-display italic text-[#e0d6c4] leading-[1.05] tracking-[-0.01em]"
              style={{ fontSize: "clamp(2rem, 4.5vw, 4.25rem)" }}
            >
              I came here looking for someone to argue with at dinner. I found three.
            </p>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a7f6a]">
              Lena · Member № 0294 · joined April 2026
            </p>
          </div>
        </div>
      </div>

      {/* ── Asymmetric editorial split: still life + manifesto ── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 mt-28 sm:mt-40">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">

          {/* Wide image, 7 cols, sits low and heavy */}
          <figure className="col-span-12 lg:col-span-7 lg:row-span-2">
            <div className="relative aspect-[5/3] overflow-hidden bg-[#1a1410] card-shadow">
              <img
                src={detailImg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover duotone"
                loading="lazy"
              />
              <div className="absolute inset-0 duotone-tint pointer-events-none"/>
              <div className="absolute inset-0 grain pointer-events-none"/>
            </div>
            <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#5a5349]">
              Pl. II — From the March dinner
            </figcaption>
          </figure>

          {/* Header for the manifesto */}
          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#c4956c]">
              House rules
            </div>
            <h2 className="font-display italic text-3xl md:text-4xl mt-3 leading-[1.05] text-[#e8e0d0]">
              Small. Slow.
              <br/>
              Strangely specific.
            </h2>
          </div>

          {/* Body of the manifesto */}
          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <p className="font-display text-[#a89d87] leading-[1.7] text-[15px]">
              We don't run the numbers up. We don't run them at all. There are no
              push notifications, no streaks, no green dots. If you go quiet for a
              month, nothing happens; if you go quiet for six, you'll get a letter
              asking if you're alright.
            </p>
            <p className="font-display text-[#a89d87] leading-[1.7] text-[15px] mt-5">
              The application has a section that says "Why kbridge." Write the
              part that is true even when it's embarrassing. That is the part the
              committee reads twice.
            </p>
          </div>
        </div>
      </div>

      {/* ── Application footer / call-to-action ──────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 mt-28 sm:mt-40">
        <div className="border-t border-[#3a352d] pt-10 grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 md:col-span-7">
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#c4956c]">
              Currently reading
            </div>
            <p className="font-display italic text-2xl md:text-3xl text-[#e8e0d0] mt-3 leading-tight max-w-2xl">
              Applications submitted this month. Decisions sent before the next.
            </p>
          </div>
          <div className="col-span-12 md:col-span-5 flex flex-wrap gap-3 justify-start md:justify-end">
            <Btn variant="primary" onClick={()=>navigate("/apply")}>
              Begin an application <ArrowRight size={14}/>
            </Btn>
            <Btn variant="ghost" onClick={()=>navigate("/login")}>
              I'm already a member
            </Btn>
          </div>
        </div>
      </div>

      {/* ── Colophon (not a copyright line) ──────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 mt-24 pb-12">
        <div className="h-px bg-[#3a352d]"/>
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#5a5349] max-w-xl">
            A colophon. Set in Fraunces and JetBrains Mono. Read by the committee.
            Written, mostly, on weekends. Brooklyn, 2026.
          </p>
          <Link to="/apply" className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#c4956c] hover:text-[#d4a47c]">
            Apply →
          </Link>
        </div>
      </div>
    </div>
  );
};

// ── Auth ──────────────────────────────────────────────────────────────────────
const AuthPage = () => {
  const {user,profile,loading} = useAuth();
  const navigate = useNavigate();
  const [mode,setMode]       = useState("login");
  const [email,setEmail]     = useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]       = useState(false);
  const [error,setError]     = useState("");

  useEffect(()=>{
    if(loading) return;
    if(user && profile?.onboarding_complete) navigate("/discover", {replace:true});
    else if(user) navigate("/onboarding", {replace:true});
  },[user,profile,loading]);

  const submit = async () => {
    setError(""); setBusy(true);
    try {
      if(mode==="signup"){
        const {error} = await supabase.auth.signUp({email,password});
        if(error) throw error;
      } else {
        const {error} = await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
      }
    } catch(e){ setError(e.message||"Something went wrong."); }
    finally{ setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#0e0d0b] text-[#e8e0d0] grain relative flex flex-col">
      <FontLoader/>
      <div className="border-b border-[#3a352d] px-8 py-5 flex items-center justify-between">
        <Link to="/" className="font-display text-xl">kbridge<span className="italic text-[#c4956c]">.</span></Link>
        <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a] hover:text-[#e8e0d0] flex items-center gap-2"><ArrowLeft size={12}/> Home</Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-12"><div className="font-display text-4xl mb-2">Welcome.</div><Label>Members' Society</Label></div>
          <div className="flex border-b border-[#3a352d] mb-10">
            {[["login","Sign In"],["signup","Apply"]].map(([key,label])=>(
              <button key={key} onClick={()=>{setMode(key);setError("");}} className={`flex-1 pb-4 font-mono text-[11px] uppercase tracking-[0.22em] transition-all ${mode===key?"text-[#c4956c] border-b border-[#c4956c] -mb-px":"text-[#5a5349] hover:text-[#8a7f6a]"}`}>{label}</button>
            ))}
          </div>
          <div className="space-y-8">
            <TextField label="Email Address" value={email} onChange={setEmail} placeholder="you@example.com" type="email" autoComplete="email"/>
            <TextField label="Password" value={password} onChange={setPassword} placeholder="Min. 8 characters" type="password" autoComplete={mode==="signup"?"new-password":"current-password"}/>
            {error&&(
              <div className="flex items-start gap-3 border border-[#8b5a5a]/40 bg-[#8b5a5a]/10 p-4 animate-slide-in">
                <AlertCircle size={16} className="text-[#d4928f] flex-shrink-0 mt-0.5"/>
                <span className="text-[#d4928f] text-sm">{error}</span>
              </div>
            )}
            <Btn variant="primary" onClick={submit} disabled={busy||!email||password.length<8} className="w-full">
              {busy?"One moment…":mode==="login"?"Enter the Society":"Begin Application"}{!busy&&<ArrowRight size={14}/>}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Onboarding Shell ──────────────────────────────────────────────────────────
const OnboardingShell = ({step,totalSteps=7,title,subtitle,children,onBack,onNext,nextLabel="Continue",canContinue=true,loading=false}) => (
  <div className="min-h-screen bg-[#0e0d0b] text-[#e8e0d0] grain relative">
    <FontLoader/>
    <div className="max-w-2xl mx-auto px-8 py-8">
      <div className="flex justify-between items-center border-b border-[#3a352d] pb-6">
        <div className="font-display text-xl">kbridge<span className="italic text-[#c4956c]">.</span></div>
        <Label>Application {String(step).padStart(2,"0")} / {String(totalSteps).padStart(2,"0")}</Label>
      </div>
      <div className="mt-4 flex gap-1">
        {Array.from({length:totalSteps}).map((_,i)=>(
          <div key={i} className={`h-[2px] flex-1 transition-all duration-500 ${i<step?"bg-[#c4956c]":"bg-[#3a352d]"}`}/>
        ))}
      </div>
      <div className="mt-16 animate-fade-up">
        <Label>Section {String(step).padStart(2,"0")}</Label>
        <h1 className="font-display text-4xl md:text-5xl mt-4 leading-tight">{title}</h1>
        {subtitle&&<p className="font-display italic text-lg text-[#a89d87] mt-4 max-w-xl leading-relaxed">{subtitle}</p>}
        <div className="mt-12">{children}</div>
      </div>
      <div className="mt-16 flex justify-between items-center pt-6 border-t border-[#3a352d]">
        <button onClick={onBack} className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a] hover:text-[#e8e0d0] flex items-center gap-2"><ArrowLeft size={12}/> Back</button>
        <Btn variant="primary" onClick={onNext} disabled={!canContinue||loading}>{loading?"Saving…":nextLabel}{!loading&&<ArrowRight size={14}/>}</Btn>
      </div>
    </div>
  </div>
);

// ── Onboarding Page ───────────────────────────────────────────────────────────
const OnboardingPage = () => {
  const {user, refreshProfile} = useAuth();
  const navigate = useNavigate();
  const [step,setStep]     = useState(1);
  const [data,setData]     = useState({});
  const [saving,setSaving] = useState(false);

  const next = () => { if(step>=7) finish(); else setStep(s=>s+1); };
  const back = () => { if(step<=1) navigate("/auth"); else setStep(s=>s-1); };

  const finish = async () => {
    setSaving(true);
    const updates = {
      first_name:data.firstName, age:data.age?parseInt(data.age):null,
      city:data.city, occupation:data.occupation, school:data.school, degree:data.degree,
      bio:data.bio, communities:data.userCommunities||[],
      tier:data.tier||"member", invite_code_used:data.inviteCode||null,
      identity_verified:data.identityStatus==="verified",
      education_verified:data.educationStatus==="verified",
      photos_uploaded:(data.photos||[]).filter(Boolean).length,
      pref_communities:data.prefCommunities||[],
      pref_age_min:data.ageMin?parseInt(data.ageMin):24,
      pref_age_max:data.ageMax?parseInt(data.ageMax):40,
      // ── New fields ──
      nationality: data.nationality||null,
      passport_country: data.passportCountry||null,
      appearance_score: data.appearanceScore?.overall||null,
      appearance_score_breakdown: data.appearanceScore||null,
      application_status: "pending",
      // ──────────────
      onboarding_complete:true, updated_at:new Date().toISOString(),
    };
    const {error} = await supabase.from("profiles").update(updates).eq("id",user.id);
    setSaving(false);
    if(!error){ await refreshProfile(); navigate("/discover"); }
  };

  const sp={data,setData};

  const steps = [
    <InviteStep    key={1} {...sp} onNext={next} onBack={back}/>,
    <IdentityStep  key={2} {...sp} onNext={next} onBack={back}/>,
    <EducationStep key={3} {...sp} onNext={next} onBack={back}/>,
    <ProfileStep   key={4} {...sp} onNext={next} onBack={back}/>,
    <PhotosStep    key={5} {...sp} onNext={next} onBack={back}/>,
    <PreferencesStep key={6} {...sp} onNext={next} onBack={back}/>,
    <MembershipStep  key={7} {...sp} onNext={next} onBack={back} loading={saving}/>,
  ];

  return steps[step-1];
};

// Onboarding step components
const InviteStep = ({onNext,onBack,data,setData}) => {
  const [mode,setMode]=useState(data.inviteMode||"apply");
  const [codeValid,setCv]=useState(null);
  const [checking,setChk]=useState(false);
  const checkCode=async code=>{
    if(!code||code.length<6){setCv(null);return;}
    setChk(true);
    try{const{data:inv}=await supabase.from("invitations").select("id,used_by,expires_at").eq("code",code.toUpperCase()).single();setCv(!!(inv&&!inv.used_by&&new Date(inv.expires_at)>new Date()));}
    catch{setCv(false);}
    setChk(false);
  };
  return (
    <OnboardingShell step={1} title={<>How did you <em className="italic text-[#c4956c]">find us</em>?</>} subtitle="Referred by a member, or applying via the committee."
      onBack={onBack} onNext={()=>{setData({...data,inviteMode:mode});onNext();}} canContinue={mode==="apply"||(mode==="code"&&codeValid===true)}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[["apply","Open application","~12% accepted.",<Sparkles key="s" size={18} className="text-[#c4956c] mb-4"/>],["code","I have an invitation","Fastest route.",<Award key="a" size={18} className="text-[#c4956c] mb-4"/>]].map(([key,t,s,icon])=>(
            <button key={key} onClick={()=>{setMode(key);setData({...data,inviteMode:key});}} className={`p-6 text-left border transition-all ${mode===key?"border-[#c4956c] bg-[#1a1815]":"border-[#3a352d] hover:border-[#5a5349]"}`}>
              {icon}<div className="font-display text-lg">{t}</div><div className="text-[#8a7f6a] text-sm mt-1">{s}</div>
            </button>
          ))}
        </div>
        {mode==="code"&&(
          <div className="animate-slide-in space-y-3">
            <div className="relative">
              <TextField label="Invitation Code" value={data.inviteCode||""} placeholder="Eg. LIN-FOUNDING-4829" onChange={v=>{setData({...data,inviteCode:v.toUpperCase()});checkCode(v);}}/>
              {checking&&<span className="absolute right-0 bottom-3 font-mono text-[10px] text-[#8a7f6a] uppercase tracking-[0.2em]">checking…</span>}
              {codeValid===true&&<Check size={16} className="absolute right-0 bottom-3.5 text-[#c4956c]"/>}
              {codeValid===false&&<X size={16} className="absolute right-0 bottom-3.5 text-[#d4928f]"/>}
            </div>
            {codeValid===false&&<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4928f]">Code not found or already used.</p>}
          </div>
        )}
      </div>
    </OnboardingShell>
  );
};

const IdentityStep = ({onNext,onBack,data,setData}) => {
  const [status,setS]=useState(data.identityStatus||"idle");
  const run=()=>{setS("uploading");setTimeout(()=>setS("verifying"),1200);setTimeout(()=>{setS("verified");setData({...data,identityStatus:"verified"});},3000);};
  return (
    <OnboardingShell step={2} title={<>Verify your <em className="italic text-[#c4956c]">identity</em>.</>} subtitle="Government-issued ID and a brief liveness check." onBack={onBack} onNext={onNext} canContinue={status==="verified"}>
      <div className="space-y-6">
        <div className="border border-[#3a352d] p-8 bg-[#1a1815]">
          <div className="flex items-start gap-4">
            <Shield className="text-[#c4956c] flex-shrink-0 mt-1" size={24}/>
            <div className="flex-1">
              <div className="font-display text-xl">Document + Liveness</div>
              <div className="text-[#8a7f6a] text-sm mt-1 mb-6">Passport, driver's license, or state ID.</div>
              {status==="idle"&&<Btn variant="outline" onClick={run}><Upload size={14}/> Begin Verification</Btn>}
              {(status==="uploading"||status==="verifying")&&<div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a89d87] flex items-center gap-3"><span className="typing-dot">●</span><span className="typing-dot">●</span><span className="typing-dot">●</span>{status==="uploading"?"Reading document":"Matching biometrics"}</div>}
              {status==="verified"&&<div className="space-y-3 animate-fade-up">{["Document authenticity","Face-to-document match","Liveness detection"].map(i=><div key={i} className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-[#c4956c]/20 flex items-center justify-center"><Check size={12} className="text-[#c4956c]"/></div><span className="text-[#e8e0d0] text-sm">{i}</span><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c4956c] ml-auto">verified</span></div>)}</div>}
            </div>
          </div>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#5a5349] leading-relaxed">Encrypted end-to-end · Document not stored</p>
      </div>
    </OnboardingShell>
  );
};

const EducationStep = ({onNext,onBack,data,setData}) => {
  const [status,setS]=useState(data.educationStatus||"idle");
  const [school,setSchool]=useState(data.school||"");
  const [degree,setDegree]=useState(data.degree||"");
  const run=()=>{setS("verifying");setTimeout(()=>{setS("verified");setData({...data,educationStatus:"verified",school,degree});},2200);};
  return (
    <OnboardingShell step={3} title={<>Verify your <em className="italic text-[#c4956c]">credentials</em>.</>} subtitle="We confirm your graduate degree through the National Student Clearinghouse." onBack={onBack} onNext={onNext} canContinue={status==="verified"}>
      <div className="space-y-6">
        <TextField label="Institution" value={school} onChange={setSchool} placeholder="Eg. Yale University"/>
        <div className="space-y-2">
          <Label>Highest Degree Awarded</Label>
          <select value={degree} onChange={e=>setDegree(e.target.value)} className="w-full bg-transparent border-b border-[#3a352d] pb-3 text-[#e8e0d0] font-display text-lg focus:border-[#c4956c] transition-colors">
            <option value="" style={{background:"#0e0d0b"}}>Select degree</option>
            {["Master's (MA, MS, MBA, MArch, etc.)","Juris Doctor (J.D.)","Doctor of Medicine (M.D.)","Doctor of Philosophy (Ph.D.)","Other Doctorate"].map(d=><option key={d} value={d} style={{background:"#0e0d0b"}}>{d}</option>)}
          </select>
        </div>
        {status==="idle"&&school&&degree&&<Btn variant="outline" onClick={run}><GraduationCap size={14}/> Verify via Clearinghouse</Btn>}
        {status==="verifying"&&<div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a89d87] flex items-center gap-3"><span className="typing-dot">●</span><span className="typing-dot">●</span><span className="typing-dot">●</span> Querying Clearinghouse</div>}
        {status==="verified"&&<div className="border border-[#c4956c]/30 bg-[#c4956c]/5 p-6 animate-fade-up"><div className="flex items-start gap-3"><Check size={18} className="text-[#c4956c] mt-1"/><div><div className="font-display text-lg">Credential Confirmed</div><div className="text-[#a89d87] text-sm mt-1 font-display italic">{degree}, {school}</div></div></div></div>}
      </div>
    </OnboardingShell>
  );
};

const ProfileStep = ({onNext,onBack,data,setData}) => {
  const communities=["Chinese","Japanese","Korean","Vietnamese","Filipino","Thai","Taiwanese","Indian","Pakistani","Bangladeshi","Indonesian","Malaysian","Other"];
  const selected=data.userCommunities||[];

  const NATIONALITIES = ["American","Australian","British","Canadian","Chinese","Filipino","Indian","Indonesian","Japanese","Korean","Malaysian","New Zealander","Singaporean","Taiwanese","Thai","Vietnamese","Other"];

  return (
    <OnboardingShell step={4} title={<>About <em className="italic text-[#c4956c]">you</em>.</>} subtitle="Information that appears on your profile." onBack={onBack} onNext={onNext} canContinue={!!(data.firstName&&data.occupation&&data.city)}>
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-6"><TextField label="First Name" value={data.firstName||""} onChange={v=>setData({...data,firstName:v})} placeholder="Your first name"/><TextField label="Age" value={data.age||""} onChange={v=>setData({...data,age:v})} placeholder="28" type="number"/></div>
        <TextField label="City" value={data.city||""} onChange={v=>setData({...data,city:v})} placeholder="Eg. Brooklyn"/>
        <TextField label="Occupation" value={data.occupation||""} onChange={v=>setData({...data,occupation:v})} placeholder="Eg. Architect at SOM"/>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Nationality</Label>
            <select value={data.nationality||""} onChange={e=>setData({...data,nationality:e.target.value})} className="w-full bg-transparent border-b border-[#3a352d] pb-2 text-[#e8e0d0] font-display text-base focus:border-[#c4956c] transition-colors appearance-none cursor-pointer">
              <option value="" className="bg-[#1a1815]">Select…</option>
              {NATIONALITIES.map(n=><option key={n} value={n} className="bg-[#1a1815]">{n}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Passport Country</Label>
            <select value={data.passportCountry||""} onChange={e=>setData({...data,passportCountry:e.target.value})} className="w-full bg-transparent border-b border-[#3a352d] pb-2 text-[#e8e0d0] font-display text-base focus:border-[#c4956c] transition-colors appearance-none cursor-pointer">
              <option value="" className="bg-[#1a1815]">Select…</option>
              {NATIONALITIES.map(n=><option key={n} value={n} className="bg-[#1a1815]">{n}</option>)}
            </select>
          </div>
        </div>
        <div><Label>Communities (optional, self-identified)</Label><div className="flex flex-wrap gap-2 mt-3">{communities.map(c=><button key={c} onClick={()=>{const n=selected.includes(c)?selected.filter(x=>x!==c):[...selected,c];setData({...data,userCommunities:n});}} className={`px-4 py-2 text-sm font-display transition-all ${selected.includes(c)?"bg-[#c4956c] text-[#0e0d0b]":"border border-[#3a352d] text-[#a89d87] hover:border-[#c4956c]"}`}>{c}</button>)}</div></div>
        <div className="space-y-2"><Label>A short biography</Label><textarea value={data.bio||""} onChange={e=>setData({...data,bio:e.target.value})} rows={4} placeholder="Something true. No clichés." className="w-full bg-transparent border-b border-[#3a352d] pb-3 text-[#e8e0d0] font-display text-lg placeholder:text-[#5a5349] focus:border-[#c4956c] transition-colors resize-none"/></div>
      </div>
    </OnboardingShell>
  );
};

const PhotosStep = ({onNext,onBack,data,setData}) => {
  const photos=data.photos||[null,null,null,null];
  const grads=["portrait-gradient-1","portrait-gradient-2","portrait-gradient-3","portrait-gradient-4","portrait-gradient-7","portrait-gradient-8"];
  const fakeUpload=i=>{const n=[...photos];n[i]=grads[Math.floor(Math.random()*grads.length)];setData({...data,photos:n});};
  const count=photos.filter(Boolean).length;
  const score=data.appearanceScore;

  // Generate mock score once 3 photos are uploaded
  React.useEffect(()=>{
    if(count>=3&&!data.appearanceScore){
      import("./lib/face-score.js").then(({mockScore})=>{
        const s=mockScore(data.firstName||"applicant");
        setData(d=>({...d,appearanceScore:s}));
      });
    }
  },[count]);

  return (
    <OnboardingShell step={5} title={<>Your <em className="italic text-[#c4956c]">portraits</em>.</>} subtitle="At least three photographs. Current, clear, and of you alone." onBack={onBack} onNext={onNext} canContinue={count>=3}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">{photos.map((p,i)=><button key={i} onClick={()=>fakeUpload(i)} className={`aspect-[3/4] border transition-all relative overflow-hidden ${p?`${p} grain`:"border-dashed border-[#3a352d] hover:border-[#c4956c] bg-[#1a1815]"}`}>{p?<div className="absolute top-3 right-3 bg-[#0e0d0b]/60 px-2 py-1"><span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#c4956c]">Photo {i+1}</span></div>:<div className="h-full flex flex-col items-center justify-center gap-2"><Camera size={20} className="text-[#5a5349]"/><span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#5a5349]">Photo {i+1}</span></div>}</button>)}</div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#5a5349]">{count} of 4 uploaded · Click to simulate upload</p>

        {score&&count>=3&&(
          <div className="border border-[#3a352d] bg-[#0e0d0b] p-5 animate-fade-up space-y-4">
            <div className="flex items-center justify-between">
              <Label>Portrait Assessment</Label>
              <span className="font-display italic text-[#c4956c] text-xl">{score.overall}<span className="text-[#5a5349] text-base">/10</span></span>
            </div>
            <p className="font-display italic text-[#a89d87] text-sm leading-relaxed">"{score.note}"</p>
            {score.tier_recommendation!=="observer"&&(
              <div className="border-t border-[#3a352d] pt-4">
                <Label className="block mb-1">Your portraits qualify for a pricing benefit.</Label>
                <p className="font-mono text-[10px] text-[#5a5349] mt-1">You'll see your adjusted rates on the next step.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </OnboardingShell>
  );
};

const PreferencesStep = ({onNext,onBack,data,setData}) => {
  const communities=["Chinese","Japanese","Korean","Vietnamese","Filipino","Thai","Taiwanese","Indian","Pakistani","Bangladeshi","Indonesian","Malaysian","No preference"];
  const selected=data.prefCommunities||["No preference"];
  const toggle=c=>{let n;if(c==="No preference"){n=["No preference"];}else{const f=selected.filter(x=>x!=="No preference");n=f.includes(c)?f.filter(x=>x!==c):[...f,c];if(n.length===0)n=["No preference"];}setData({...data,prefCommunities:n});};
  return (
    <OnboardingShell step={6} title={<>Who you <em className="italic text-[#c4956c]">hope to meet</em>.</>} subtitle="Private preferences that shape your feed. Never shown on your profile." onBack={onBack} onNext={onNext}>
      <div className="space-y-10">
        <div className="space-y-2"><Label>Age Range</Label><div className="flex items-center gap-4 pt-2"><input type="number" value={data.ageMin||26} onChange={e=>setData({...data,ageMin:e.target.value})} className="w-20 bg-transparent border-b border-[#3a352d] pb-2 text-[#e8e0d0] font-display text-xl focus:border-[#c4956c]"/><span className="text-[#5a5349]">—</span><input type="number" value={data.ageMax||38} onChange={e=>setData({...data,ageMax:e.target.value})} className="w-20 bg-transparent border-b border-[#3a352d] pb-2 text-[#e8e0d0] font-display text-xl focus:border-[#c4956c]"/></div></div>
        <div><Label>Communities (private, filtering only)</Label><div className="flex flex-wrap gap-2 mt-3">{communities.map(c=><button key={c} onClick={()=>toggle(c)} className={`px-4 py-2 text-sm font-display transition-all ${selected.includes(c)?"bg-[#c4956c] text-[#0e0d0b]":"border border-[#3a352d] text-[#a89d87] hover:border-[#c4956c]"}`}>{c}</button>)}</div></div>
      </div>
    </OnboardingShell>
  );
};

const MembershipStep = ({onNext,onBack,data,setData,loading}) => {
  const tiers=[TIERS.observer,TIERS.member,TIERS.founding];
  const selected=data.tier||"member";
  const score=data.appearanceScore;

  // Score → pricing adjustment
  const pricingFor=(tierKey)=>{
    if(!score) return null;
    const rec=score.tier_recommendation;
    if(tierKey==="member"&&(rec==="complimentary"||rec==="founding")) return {label:"50% off",adjusted:"$16",original:"$32"};
    if(tierKey==="member"&&rec==="member") return {label:"25% off",adjusted:"$24",original:"$32"};
    if(tierKey==="founding"&&rec==="complimentary") return {label:"50% off",adjusted:"$60",original:"$120"};
    if(tierKey==="observer"&&rec==="complimentary") return {label:"Complimentary",adjusted:"$0",original:"Free"};
    return null;
  };

  return (
    <OnboardingShell step={7} title={<>Select your <em className="italic text-[#c4956c]">tier</em>.</>} subtitle={score&&score.tier_recommendation!=="observer"?"Your portrait assessment qualifies you for adjusted rates.":"Flat pricing for every member of a given tier."} onBack={onBack} onNext={()=>{setData({...data,tier:selected});onNext();}} nextLabel="Complete Application" loading={loading}>
      <div className="space-y-4">{tiers.map(t=>{
        const pricing=pricingFor(t.key);
        return (
          <button key={t.key} onClick={()=>setData({...data,tier:t.key})} className={`w-full text-left p-6 border transition-all relative ${selected===t.key?"border-[#c4956c] bg-[#1a1815]":"border-[#3a352d] hover:border-[#5a5349]"}`}>
            {t.recommended&&<span className="absolute -top-2 left-6 bg-[#c4956c] text-[#0e0d0b] font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-1">Most Members</span>}
            {pricing&&<span className="absolute -top-2 right-6 bg-[#2a4a35] border border-[#4a8a5a]/60 text-[#7aab8a] font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-1">{pricing.label}</span>}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-baseline gap-3"><span className="font-display text-2xl">{t.name}</span>{t.key==="founding"&&<Crown size={14} className="text-[#c4956c]"/>}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  {pricing
                    ? <><span className="font-display italic text-3xl text-[#c4956c]">{pricing.adjusted}</span><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a7f6a] line-through">{pricing.original}</span><span className="font-mono text-[10px] text-[#7aab8a]">{t.priceMeta}</span></>
                    : <><span className="font-display italic text-3xl text-[#c4956c]">{t.price}</span><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a7f6a]">{t.priceMeta}</span></>
                  }
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border transition-all ${selected===t.key?"border-[#c4956c] bg-[#c4956c]":"border-[#3a352d]"}`}>{selected===t.key&&<Check size={12} className="text-[#0e0d0b] m-auto mt-0.5"/>}</div>
            </div>
            <ul className="mt-5 space-y-2">{t.features.map(f=><li key={f} className="flex gap-2 text-sm text-[#a89d87]"><span className="text-[#c4956c]">·</span>{f}</li>)}</ul>
          </button>
        );
      })}</div>
    </OnboardingShell>
  );
};

// ── Discover Page ─────────────────────────────────────────────────────────────
const DiscoverPage = () => {
  const {user,profile} = useAuth();
  const {correspondences} = useAppState();
  const navigate = useNavigate();
  const [index,setIndex]   = useState(0);
  const [direction,setDir] = useState(null);
  const [noteFor,setNoteFor] = useState(null);
  const [sentFor,setSentFor] = useState(null);
  const [upgrade,setUpgrade]=useState(null);
  const [members,setMembers] = useState([]);
  const [pendingIds,setPendingIds] = useState(new Set());
  const [loadingMembers,setLoadingMembers] = useState(true);

  // Load discoverable members + ids already in flight or matched
  useEffect(()=>{
    if(!user?.id) return;
    let active = true;
    (async()=>{
      setLoadingMembers(true);
      try {
        const [{data: members, error: mErr}, {data: outgoing}] = await Promise.all([
          supabase.from("profiles")
            .select("id, first_name, age, city, occupation, school, degree, bio, communities, member_number, identity_verified, education_verified, photos_uploaded")
            .eq("onboarding_complete", true)
            .neq("id", user.id),
          supabase.from("introduction_requests")
            .select("recipient_id, status")
            .eq("requester_id", user.id)
            .in("status", ["pending","accepted"]),
        ]);
        if(!active) return;
        if(mErr) throw mErr;
        setMembers(members || []);
        setPendingIds(new Set((outgoing||[]).map(r=>r.recipient_id)));
      } catch (e) {
        console.error("load discover members", e);
      } finally {
        if(active) setLoadingMembers(false);
      }
    })();
    return ()=>{ active=false; };
  },[user?.id]);

  const matchedIds = new Set(correspondences.map(c=>c.other?.id).filter(Boolean));
  const available = members
    .filter(p => !matchedIds.has(p.id) && !pendingIds.has(p.id))
    .map(displayProfile)
    .filter(Boolean);

  const card = available[index % Math.max(available.length,1)];
  const introCheck = canSendIntro(profile||{tier:"observer",intros_used_this_week:0});

  const act = dir => {
    if(dir==="like"){
      if(!introCheck.allowed){setUpgrade({reason:introCheck.reason,req:introCheck.upgradeRequired});return;}
      setNoteFor(card);
      return;
    }
    setDir(dir);
    setTimeout(()=>{
      setIndex(i=>i+1); setDir(null);
    },350);
  };

  const handleNoteSubmitted = (recipient) => {
    setNoteFor(null);
    setPendingIds(prev => new Set([...prev, recipient.id]));
    setSentFor(recipient);
    setIndex(i=>i+1);
  };

  const handleUpgrade = async tier => {
    await supabase.from("profiles").update({tier}).eq("id",profile?.id);
    window.location.reload();
  };

  if(loadingMembers) return (
    <AppShell navTitle="Discover">
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="text-[#8a7f6a] font-mono text-[11px] uppercase tracking-[0.22em]">Loading members…</div>
      </div>
    </AppShell>
  );

  if(!card) return (
    <AppShell navTitle="Discover">
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div><div className="font-display text-3xl italic text-[#c4956c]">No new members to introduce.</div><div className="text-[#8a7f6a] mt-4">You've already reached out to everyone the committee has surfaced. New members are reviewed each week.</div></div>
      </div>
    </AppShell>
  );

  return (
    <AppShell navTitle="Discover">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-6">
          <div className="flex justify-between items-baseline mb-6">
            <Label>Today's Introductions</Label>
            <div className="flex items-center gap-3">
              {profile?.tier==="observer"&&introCheck.remaining!==undefined&&<Label className="text-[#c4956c]">{introCheck.remaining} of {TIERS.observer.introsPerWeek} left</Label>}
              <Label>{index+1} of {available.length}</Label>
            </div>
          </div>

          <div className={`transition-all duration-300 ${direction==="like"?"translate-x-16 opacity-0 rotate-3":direction==="pass"?"-translate-x-16 opacity-0 -rotate-3":""}`}>
            <div className="bg-gradient-to-b from-[#1a1815] to-[#15120e] border border-[#3a352d] card-shadow">
              {/* Portrait with thin dossier strip overlaid at bottom */}
              <div className="relative">
                <Portrait profile={card}/>
                <div className="absolute inset-x-0 bottom-0 px-7 py-5 flex items-baseline justify-between">
                  <Label>Member Dossier</Label>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#c4956c]">{card.memberNumber}</span>
                </div>
              </div>

              {/* Resume header — name, headline, location/age */}
              <div className="px-7 pt-7 pb-6 border-b border-[#3a352d]">
                <h2 className="font-display tracking-[-0.015em] leading-[1.02]" style={{fontSize:"clamp(2.25rem,6vw,2.75rem)"}}>{card.name}</h2>
                <p className="font-display italic text-[#c4956c] text-lg mt-2 leading-snug">{card.occupation}</p>
                <div className="mt-4 h-px w-10 bg-[#c4956c]/50"/>
                <div className="flex items-center gap-3 mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a]">
                  <div className="flex items-center gap-1.5"><MapPin size={11}/><span>{card.city}</span></div>
                  <span className="w-0.5 h-0.5 rounded-full bg-[#5a5349]"/>
                  <span>{card.age} yrs</span>
                </div>
              </div>

              {/* CV body */}
              <div className="px-7 py-7 space-y-7">
                {card.education && (
                  <div>
                    <div className="flex items-baseline justify-between mb-2.5">
                      <Label>Education</Label>
                      {card.educationVerified && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#5a5349] flex items-center gap-1.5">Verified <Check size={10} className="text-[#c4956c]"/></span>
                      )}
                    </div>
                    <div className="font-display text-[15px] leading-snug">{card.education}</div>
                  </div>
                )}

                {card.education && card.bio && <Rule/>}

                {card.bio && (
                  <div>
                    <Label>Profile</Label>
                    <p className="font-display text-[15px] leading-[1.75] text-[#d8cdb8] mt-3">{card.bio}</p>
                  </div>
                )}

                {card.bio && card.communities?.length > 0 && <Rule/>}

                {card.communities?.length > 0 && (
                  <div>
                    <Label>Background</Label>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {card.communities.map(c=>(
                        <span key={c} className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a89d87] border border-[#3a352d] px-2.5 py-1">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-8">
            <button onClick={()=>act("pass")} className="border border-[#3a352d] py-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#8a7f6a] hover:border-[#8b5a5a] hover:text-[#d4928f] transition-all">
              Pass
            </button>
            <button onClick={()=>act("like")} className="bg-[#c4956c] text-[#0e0d0b] py-4 font-mono text-[11px] uppercase tracking-[0.22em] hover:bg-[#d4a47c] transition-all flex items-center justify-center gap-2" style={{animation:"pulseGlow 2.4s ease-in-out infinite"}}>
              Request Introduction <ArrowRight size={13}/>
            </button>
          </div>
        </div>
      </div>

      {noteFor && <IntroNoteSheet recipient={noteFor} onClose={()=>setNoteFor(null)} onSubmitted={handleNoteSubmitted}/>}
      {sentFor && <RequestSentModal recipient={sentFor} onClose={()=>setSentFor(null)} onViewInbox={()=>{setSentFor(null);navigate("/introductions");}}/>}
      {upgrade && <TierUpgradeModal reason={upgrade.reason} upgradeRequired={upgrade.req} onClose={()=>setUpgrade(null)} onUpgrade={handleUpgrade}/>}
    </AppShell>
  );
};

// ── Correspondence List Page ──────────────────────────────────────────────────
const ThreadsPage = () => {
  const {user} = useAuth();
  const {correspondences,loading} = useAppState();

  if(loading && correspondences.length===0) return (
    <AppShell navTitle="Correspondence">
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="text-[#8a7f6a] font-mono text-[11px] uppercase tracking-[0.22em]">Loading…</div>
      </div>
    </AppShell>
  );

  if(correspondences.length===0) return (
    <AppShell navTitle="Correspondence">
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div><div className="font-display text-3xl italic text-[#c4956c]">No correspondence yet.</div><div className="text-[#8a7f6a] mt-4">When an introduction is accepted, the correspondence begins here.</div></div>
      </div>
    </AppShell>
  );

  return (
    <AppShell navTitle="Correspondence">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-6">
          <Label>Members' Correspondence</Label>
          <h2 className="font-display text-4xl mt-2 mb-8">Introductions</h2>
          <div className="space-y-0">
            {correspondences.map(c=>{
              const other = displayProfile(c.other) || { name:"Member", memberNumber:"№ ——", gradient:"portrait-gradient-7", initials:"?" };
              const last = c.lastMessage;
              const lastText = !last
                ? "Begin a conversation"
                : last.sender_id === user?.id
                  ? `You: ${last.body}`
                  : last.body;
              return (
                <Link key={c.matchId} to={`/correspondence/${c.matchId}`} className="w-full text-left flex items-center gap-4 py-4 border-b border-[#3a352d] hover:bg-[#1a1815] transition-all px-2">
                  <div className="w-14 h-14 flex-shrink-0 overflow-hidden"><Portrait profile={other} size="square"/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <div className="font-display text-xl">{other.name}</div>
                      <div className="flex items-center gap-2">
                        {c.unread > 0 && <span className="bg-[#c4956c] text-[#0e0d0b] font-mono text-[9px] tracking-[0.18em] uppercase px-2 py-0.5">{c.unread} New</span>}
                        <Label>{other.memberNumber}</Label>
                      </div>
                    </div>
                    <div className="font-display italic text-sm text-[#a89d87] truncate mt-1">{lastText}</div>
                  </div>
                  <ChevronRight size={14} className="text-[#5a5349]"/>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

// ── Correspondence (Chat) Page ────────────────────────────────────────────────
const ChatPage = () => {
  const {matchId} = useParams();
  const {user} = useAuth();
  const {refresh} = useAppState();
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [notFound,setNotFound] = useState(false);
  const [draft,setDraft] = useState("");
  const [sending,setSending] = useState(false);
  const messagesRef = useRef(null);

  // Initial load
  useEffect(()=>{
    if(!user?.id || !matchId) return;
    let active = true;
    (async()=>{
      setLoading(true);
      try {
        const c = await getCorrespondence(matchId, user.id);
        if(!active) return;
        if(!c) { setNotFound(true); return; }
        setData(c);
        // Mark messages from the other party as read.
        await markCorrespondenceRead(matchId, user.id).catch(()=>{});
        refresh();
      } catch(e) {
        console.error("load correspondence", e);
        if(active) setNotFound(true);
      } finally {
        if(active) setLoading(false);
      }
    })();
    return ()=>{ active=false; };
  },[user?.id, matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: append new messages as they arrive
  useEffect(()=>{
    if(!matchId || !user?.id) return;
    const unsub = subscribeToCorrespondence(matchId, async (msg)=>{
      setData(prev => {
        if(!prev) return prev;
        if(prev.messages.some(m=>m.id===msg.id)) return prev;
        return { ...prev, messages: [...prev.messages, msg] };
      });
      // If the incoming message is from the other side, mark it read.
      if(msg.sender_id !== user.id){
        await markCorrespondenceRead(matchId, user.id).catch(()=>{});
        refresh();
      }
    });
    return unsub;
  },[matchId, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new messages
  useEffect(()=>{
    if(messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  },[data?.messages?.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if(!text || sending) return;
    setSending(true);
    try {
      const optimistic = { id: `tmp-${Date.now()}`, body: text, sender_id: user.id, created_at: new Date().toISOString(), read_at: null, _optimistic: true };
      setData(prev => prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev);
      setDraft("");
      const saved = await sendChatMessage(matchId, user.id, text);
      setData(prev => {
        if(!prev) return prev;
        return { ...prev, messages: prev.messages.map(m => m.id === optimistic.id ? saved : m) };
      });
    } catch(e) {
      console.error("send failed", e);
      // Roll back the optimistic message
      setData(prev => prev ? { ...prev, messages: prev.messages.filter(m=>!m._optimistic) } : prev);
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  if(notFound) return <Navigate to="/correspondence" replace/>;

  if(loading || !data) return (
    <AppShell navTitle="Correspondence" showBack backTo="/correspondence">
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="text-[#8a7f6a] font-mono text-[11px] uppercase tracking-[0.22em]">Loading…</div>
      </div>
    </AppShell>
  );

  const other = displayProfile(data.other) || { name:"Member", memberNumber:"№ ——", gradient:"portrait-gradient-7", initials:"?", city:"" };

  return (
    <AppShell navTitle={other.name} showBack backTo="/correspondence" hideTabBar={false}
      navActions={<Link to="/settings" className="text-[#8a7f6a] hover:text-[#c4956c]"><Settings size={17}/></Link>}>
      <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={messagesRef}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto overflow-hidden mb-3"><Portrait profile={other} size="square"/></div>
          <div className="font-display text-2xl">{other.name}</div>
          <Label>{other.memberNumber}{other.city && ` · ${other.city}`}</Label>
          <div className="font-display italic text-[#c4956c] mt-3 text-sm">Your introduction has been accepted.</div>
        </div>

        {data.intro && (
          <div className="max-w-md mx-auto border border-[#3a352d] bg-[#15120e] p-5">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-[#c4956c]">Original introduction</Label>
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#5a5349]">
                {data.intro.requester_id === user.id ? "Sent" : "Received"}
              </span>
            </div>
            <p className="font-display italic text-[15px] leading-[1.7] text-[#d8cdb8]">"{data.intro.note}"</p>
          </div>
        )}

        {data.messages.map((m)=>{
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine?"justify-end":"justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-3 ${mine?"bg-[#c4956c] text-[#0e0d0b]":"bg-[#1a1815] border border-[#3a352d] text-[#e8e0d0]"} ${m._optimistic?"opacity-60":""}`}>
                <div className="font-display">{m.body}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-[#3a352d] p-4 flex items-center gap-3 bg-[#0e0d0b]">
        <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSend()} placeholder="Write something thoughtful…" className="flex-1 bg-transparent text-[#e8e0d0] font-display text-lg placeholder:text-[#5a5349] px-2 py-3"/>
        <button onClick={handleSend} disabled={!draft.trim()||sending} className={`p-3 transition-all ${draft.trim()&&!sending?"text-[#c4956c] hover:text-[#d4a47c]":"text-[#5a5349]"}`}><Send size={18}/></button>
      </div>
    </AppShell>
  );
};

// ── Introductions Inbox ───────────────────────────────────────────────────────
// Incoming pending introduction requests. The recipient reads each note
// and accepts (which opens a correspondence) or declines.
const IntroductionsInboxPage = () => {
  const {user} = useAuth();
  const {refresh} = useAppState();
  const navigate = useNavigate();
  const [requests,setRequests] = useState([]);
  const [loading,setLoading] = useState(true);
  const [respondingId,setRespondingId] = useState(null);
  const [error,setError] = useState(null);

  const load = async () => {
    if(!user?.id) return;
    setLoading(true);
    try {
      const data = await listIncomingRequests(user.id);
      setRequests(data);
    } catch (e) {
      console.error("listIncomingRequests", e);
      setError(e?.message || "Couldn't load introductions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); /* eslint-disable-line react-hooks/exhaustive-deps */ },[user?.id]);

  useEffect(()=>{
    if(!user?.id) return;
    const unsub = subscribeToIncomingRequests(user.id, ()=>{ load(); });
    return unsub;
  },[user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = async (req) => {
    setRespondingId(req.id);
    setError(null);
    try {
      const result = await acceptIntroductionRequest(req.id);
      await refresh();
      if(result?.match_id){
        navigate(`/correspondence/${result.match_id}`);
      } else {
        load();
      }
    } catch (e) {
      console.error("acceptIntroductionRequest", e);
      setError(e?.message || "Couldn't accept the introduction.");
    } finally {
      setRespondingId(null);
    }
  };

  const handleDecline = async (req) => {
    setRespondingId(req.id);
    setError(null);
    try {
      await declineIntroductionRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      refresh();
    } catch (e) {
      console.error("declineIntroductionRequest", e);
      setError(e?.message || "Couldn't decline the introduction.");
    } finally {
      setRespondingId(null);
    }
  };

  if(loading) return (
    <AppShell navTitle="Introductions">
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="text-[#8a7f6a] font-mono text-[11px] uppercase tracking-[0.22em]">Loading…</div>
      </div>
    </AppShell>
  );

  if(!requests.length) return (
    <AppShell navTitle="Introductions">
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <div className="font-display text-3xl italic text-[#c4956c]">No introductions waiting.</div>
          <div className="text-[#8a7f6a] mt-4">When a member writes to you, their note will appear here for you to read before deciding.</div>
        </div>
      </div>
    </AppShell>
  );

  return (
    <AppShell navTitle="Introductions">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-6">
          <Label>Awaiting your response</Label>
          <h2 className="font-display text-4xl mt-2 mb-8">Introductions</h2>

          {error && (
            <div className="border border-[#8b5a5a]/50 bg-[#8b5a5a]/10 px-4 py-3 mb-6">
              <p className="font-display text-[13px] text-[#d4928f]">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {requests.map(req => {
              const r = displayProfile(req.requester) || { name:"Member", memberNumber:"№ ——", gradient:"portrait-gradient-7", initials:"?", occupation:"", city:"", age:null };
              const isResponding = respondingId === req.id;
              return (
                <div key={req.id} className="border border-[#3a352d] bg-[#15120e] card-shadow">
                  <div className="p-6 flex items-start gap-4 border-b border-[#3a352d]">
                    <div className="w-16 h-20 flex-shrink-0 overflow-hidden"><Portrait profile={r} size="square"/></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-display text-2xl leading-tight">{r.name}</h3>
                        <Label>{r.memberNumber}</Label>
                      </div>
                      {r.occupation && <p className="font-display italic text-[#c4956c] text-sm mt-1">{r.occupation}</p>}
                      <div className="flex items-center gap-2 mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a7f6a]">
                        {r.city && <span className="flex items-center gap-1"><MapPin size={10}/>{r.city}</span>}
                        {r.age && <><span className="w-0.5 h-0.5 rounded-full bg-[#5a5349]"/><span>{r.age} yrs</span></>}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <Label className="text-[#c4956c]">Their note</Label>
                    <p className="font-display italic text-[15px] leading-[1.75] text-[#e0d6c4] mt-3">"{req.note}"</p>
                  </div>

                  <div className="border-t border-[#3a352d] p-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={()=>handleDecline(req)}
                      disabled={isResponding}
                      className={`border border-[#3a352d] py-3 font-mono text-[10px] uppercase tracking-[0.22em] transition-all ${isResponding?"opacity-40 cursor-not-allowed":"text-[#8a7f6a] hover:border-[#8b5a5a] hover:text-[#d4928f]"}`}>
                      Decline
                    </button>
                    <button
                      onClick={()=>handleAccept(req)}
                      disabled={isResponding}
                      className={`bg-[#c4956c] text-[#0e0d0b] py-3 font-mono text-[10px] uppercase tracking-[0.22em] transition-all ${isResponding?"opacity-40 cursor-not-allowed":"hover:bg-[#d4a47c]"}`}>
                      {isResponding ? "Opening…" : "Accept introduction"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

// ── Events Page ───────────────────────────────────────────────────────────────
const EventsPage = () => {
  const {profile} = useAuth();
  const [rsvpd,setRsvpd] = useState([]);
  const [upgrade,setUpgrade] = useState(null);
  const check = canAccessEvents(profile||{tier:"observer"});

  const handleUpgrade = async tier => {
    await supabase.from("profiles").update({tier}).eq("id",profile?.id);
    window.location.reload();
  };

  if(!check.allowed) return (
    <AppShell navTitle="Events">
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <Crown size={32} className="text-[#c4956c] mx-auto mb-4"/>
          <div className="font-display text-3xl italic">Founding members only.</div>
          <div className="text-[#8a7f6a] mt-4 max-w-xs">Curated events are exclusive to Founding tier members.</div>
          <div className="mt-8"><Btn variant="outline" onClick={()=>setUpgrade({reason:"Events are exclusive to Founding members.",req:"founding"})}>Upgrade to Founding →</Btn></div>
        </div>
      </div>
      {upgrade&&<TierUpgradeModal reason={upgrade.reason} upgradeRequired={upgrade.req} onClose={()=>setUpgrade(null)} onUpgrade={handleUpgrade}/>}
    </AppShell>
  );

  return (
    <AppShell navTitle="Events">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-6">
          <Label>Exclusive Events</Label>
          <h2 className="font-display text-4xl mt-2 mb-8">Upcoming</h2>
          <div className="space-y-4">{MOCK_EVENTS.map(ev=>{
            const date=new Date(ev.event_date);const attending=rsvpd.includes(ev.id);
            return (
              <div key={ev.id} className="border border-[#3a352d] bg-[#1a1815] p-6">
                <div className="flex items-center gap-2 mb-3"><Crown size={12} className="text-[#c4956c]"/><Label className="text-[#c4956c]">Founding Members</Label></div>
                <div className="font-display text-2xl leading-tight">{ev.title}</div>
                <p className="text-[#a89d87] text-sm mt-3 leading-relaxed">{ev.description}</p>
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2"><Calendar size={12} className="text-[#8a7f6a]"/><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a7f6a]">{date.toLocaleDateString("en-US",{month:"long",day:"numeric"})}</span></div>
                  <div className="flex items-center gap-2"><MapPin size={12} className="text-[#8a7f6a]"/><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a7f6a]">{ev.city}</span></div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5a5349]">{ev.capacity} capacity</span>
                  <button onClick={()=>setRsvpd(r=>attending?r.filter(x=>x!==ev.id):[...r,ev.id])} className={`font-mono text-[10px] uppercase tracking-[0.22em] px-5 py-3 transition-all flex items-center gap-2 ${attending?"bg-[#c4956c] text-[#0e0d0b]":"border border-[#c4956c] text-[#c4956c] hover:bg-[#c4956c] hover:text-[#0e0d0b]"}`}>
                    {attending?<><CheckCheck size={12}/> Attending</>:"RSVP →"}
                  </button>
                </div>
              </div>
            );
          })}</div>
        </div>
      </div>
    </AppShell>
  );
};

// ── Profile Page ──────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const {user,profile} = useAuth();
  const [invites,setInvites]=useState([]);
  const [copied,setCopied]=useState(null);
  const [upgrade,setUpgrade]=useState(null);
  const tier=TIERS[profile?.tier]??TIERS.observer;

  useEffect(()=>{ if(profile?.tier==="founding") loadInvites(); },[profile?.tier]);

  const loadInvites=async()=>{
    const{data}=await supabase.from("invitations").select("*").eq("created_by",user.id).order("created_at",{ascending:false});
    setInvites(data||[]);
  };
  const generateInvite=async()=>{
    const check=canSendInvite(profile);
    if(!check.allowed){setUpgrade({reason:check.reason,req:check.upgradeRequired});return;}
    const code=`LIN-FOUNDING-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    const{data}=await supabase.from("invitations").insert({code,created_by:user.id}).select().single();
    if(data)setInvites(i=>[data,...i]);
  };
  const copyCode=code=>{navigator.clipboard.writeText(code).catch(()=>{});setCopied(code);setTimeout(()=>setCopied(null),2000);};
  const handleUpgrade=async t=>{await supabase.from("profiles").update({tier:t}).eq("id",user.id);window.location.reload();};

  return (
    <AppShell navTitle="Profile">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-6">
          <div className="flex items-start justify-between mb-8">
            <div>
              <Label>Your Membership</Label>
              <h2 className="font-display text-4xl mt-2">{profile?.first_name||"Member"}</h2>
              <div className="flex items-center gap-2 mt-1"><Label className="text-[#c4956c]">{profile?.member_number||"№ ——"}</Label>{tier.badge==="founding"&&<Crown size={12} className="text-[#c4956c]"/>}</div>
            </div>
            <Link to="/settings" className="text-[#8a7f6a] hover:text-[#c4956c] p-1"><Settings size={18}/></Link>
          </div>

          <div className="aspect-[4/3] portrait-gradient-7 grain relative mb-8"><div className="absolute bottom-4 left-4"><Label className="text-[#e8e0d0]/70">Primary Portrait</Label></div></div>

          <div className="space-y-5">
            <div><Label>Profession</Label><div className="font-display text-xl mt-1">{profile?.occupation||"—"}</div></div>
            <Rule/>
            <div><Label>Education</Label><div className="font-display text-xl mt-1 flex items-center gap-2">{profile?.degree&&profile?.school?`${profile.degree}, ${profile.school}`:"—"}{profile?.education_verified&&<Check size={14} className="text-[#c4956c]"/>}</div></div>
            <Rule/>
            <div><Label>City</Label><div className="font-display text-xl mt-1">{profile?.city||"—"}</div></div>
            <Rule/>
            <div><Label>Biography</Label><div className="font-display text-base mt-1 leading-relaxed">{profile?.bio||"Not yet provided."}</div></div>
          </div>

          {/* Tier card */}
          <div className="mt-10 border border-[#3a352d] bg-[#1a1815] p-6">
            <div className="flex items-center justify-between">
              <div><Label>Current Tier</Label><div className="flex items-baseline gap-2 mt-1"><div className="font-display text-2xl">{tier.name}</div>{tier.key==="founding"&&<Crown size={14} className="text-[#c4956c]"/>}</div></div>
              <div className="text-right"><div className="font-display italic text-2xl text-[#c4956c]">{tier.price}</div>{tier.priceMeta&&<div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a7f6a]">{tier.priceMeta}</div>}</div>
            </div>
            <Rule className="my-5"/>
            <div className="space-y-2">
              {[["Weekly introductions",tier.introsPerWeek===Infinity?"Unlimited":`${tier.introsPerWeek}/week`,true],["View who saw you",tier.canSeeWhoViewed?"Yes":"No",tier.canSeeWhoViewed],["Curated events",tier.canAccessEvents?"Yes":"No",tier.canAccessEvents],["Send invitations",tier.canSendInvites?`${tier.invitesPerMonth}/month`:"No",tier.canSendInvites]].map(([l,v,active])=>(
                <div key={l} className="flex items-center justify-between text-sm"><span className={active?"text-[#e8e0d0]":"text-[#5a5349]"}>{l}</span><span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${active?"text-[#c4956c]":"text-[#5a5349]"}`}>{v}</span></div>
              ))}
            </div>
            {tier.key!=="founding"&&<button onClick={()=>setUpgrade({reason:"Unlock all kbridge features — events, invitations, and more.","req":"founding"})} className="w-full mt-6 border border-[#c4956c] text-[#c4956c] py-3 font-mono text-[10px] uppercase tracking-[0.22em] hover:bg-[#c4956c] hover:text-[#0e0d0b] transition-all">Upgrade Tier →</button>}
          </div>

          {/* Verifications */}
          <div className="mt-6 border border-[#3a352d] p-6 bg-[#1a1815]">
            <Label>Verifications</Label>
            <div className="mt-4 space-y-3">{[["Identity",profile?.identity_verified],["Graduate Credential",profile?.education_verified],["Photographs",!!(profile?.photos_uploaded>=3)]].map(([v,ok])=>(
              <div key={v} className="flex items-center justify-between"><div className="flex items-center gap-3">{ok?<Check size={14} className="text-[#c4956c]"/>:<X size={14} className="text-[#5a5349]"/>}<span className="font-display">{v}</span></div><Label className={ok?"text-[#c4956c]":"text-[#5a5349]"}>{ok?"Verified":"Pending"}</Label></div>
            ))}</div>
          </div>

          {/* Invitations (Founding) */}
          {profile?.tier==="founding"&&(
            <div className="mt-6 border border-[#3a352d] p-6 bg-[#1a1815]">
              <div className="flex items-center justify-between mb-5"><Label>Invitations</Label><button onClick={generateInvite} className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#c4956c] hover:text-[#d4a47c] flex items-center gap-1"><Ticket size={12}/> Generate</button></div>
              {invites.length===0&&<div className="text-[#5a5349] text-sm font-display italic">No invitations generated yet.</div>}
              <div className="space-y-3">{invites.map(inv=>(
                <div key={inv.id} className="flex items-center justify-between border-b border-[#3a352d] pb-3 last:border-0 last:pb-0">
                  <div><div className="font-mono text-sm text-[#e8e0d0]">{inv.code}</div><div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5a5349] mt-1">{inv.used_by?"Used":"Unused"} · Expires {new Date(inv.expires_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div></div>
                  {!inv.used_by&&<button onClick={()=>copyCode(inv.code)} className="text-[#8a7f6a] hover:text-[#c4956c] p-2">{copied===inv.code?<CheckCheck size={14} className="text-[#c4956c]"/>:<Copy size={14}/>}</button>}
                </div>
              ))}</div>
            </div>
          )}
        </div>
      </div>
      {upgrade&&<TierUpgradeModal reason={upgrade.reason} upgradeRequired={upgrade.req} onClose={()=>setUpgrade(null)} onUpgrade={handleUpgrade}/>}
    </AppShell>
  );
};

// ── Settings Page ─────────────────────────────────────────────────────────────
const SettingsPage = () => {
  const {user,profile,adminAsMember,setAdminAsMember} = useAuth();
  const navigate = useNavigate();
  const [newPassword,setNewPw]   = useState("");
  const [pwSuccess,setPwSuccess] = useState(false);
  const [deleteConfirm,setDC]    = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", {replace:true});
  };

  const handlePasswordChange = async () => {
    const {error} = await supabase.auth.updateUser({password:newPassword});
    if(!error){ setPwSuccess(true); setNewPw(""); setTimeout(()=>setPwSuccess(false),3000); }
  };

  const sections = [
    {
      title:"Account",
      items:[
        {label:"Email", value:user?.email, static:true},
        {label:"Member Since", value:profile?.created_at?new Date(profile.created_at).toLocaleDateString("en-US",{month:"long",year:"numeric"}):"—", static:true},
        {label:"Member Number", value:profile?.member_number||"—", static:true},
      ]
    },
    {
      title:"Membership",
      items:[
        {label:"Current Tier", value:TIERS[profile?.tier]?.name||"Observer", static:true},
        {label:"Onboarding", value:profile?.onboarding_complete?"Complete":"Incomplete", static:true},
      ]
    },
  ];

  return (
    <AppShell navTitle="Settings" showBack backTo="/profile" hideTabBar={false}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-6 space-y-10">

          {/* Admin-only: view-mode toggle */}
          {profile?.is_admin && (
            <div>
              <Label className="mb-4 block">Admin</Label>
              <div className="border border-[#c4956c]/40 bg-[#c4956c]/5 p-5 space-y-4">
                <div>
                  <div className="font-display text-[#e8e0d0]">View mode</div>
                  <div className="text-[#a89d87] text-xs mt-1 leading-relaxed">
                    Choose what you see when you sign in. Use member view to test the applicant experience.
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setAdminAsMember(false); navigate("/admin"); }}
                    className={`flex-1 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.2em] border transition-colors ${
                      !adminAsMember
                        ? "border-[#c4956c] text-[#c4956c] bg-[#c4956c]/10"
                        : "border-[#3a352d] text-[#8a7f6a] hover:text-[#e8e0d0]"
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdminAsMember(true); navigate("/discover"); }}
                    className={`flex-1 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.2em] border transition-colors ${
                      adminAsMember
                        ? "border-[#c4956c] text-[#c4956c] bg-[#c4956c]/10"
                        : "border-[#3a352d] text-[#8a7f6a] hover:text-[#e8e0d0]"
                    }`}
                  >
                    Member
                  </button>
                </div>
              </div>
            </div>
          )}

          {sections.map(s=>(
            <div key={s.title}>
              <Label className="mb-4 block">{s.title}</Label>
              <div className="border border-[#3a352d] bg-[#1a1815]">
                {s.items.map((item,i)=>(
                  <div key={item.label} className={`flex items-center justify-between px-5 py-4 ${i<s.items.length-1?"border-b border-[#3a352d]":""}`}>
                    <span className="font-display text-[#a89d87]">{item.label}</span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#e8e0d0]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Change password */}
          <div>
            <Label className="mb-4 block">Security</Label>
            <div className="border border-[#3a352d] bg-[#1a1815] p-5 space-y-5">
              <TextField label="New Password" value={newPassword} onChange={setNewPw} placeholder="Min. 8 characters" type="password" autoComplete="new-password"/>
              {pwSuccess&&<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c4956c]">Password updated.</p>}
              <Btn variant="outline" onClick={handlePasswordChange} disabled={newPassword.length<8}>
                <KeyRound size={13}/> Update Password
              </Btn>
            </div>
          </div>

          {/* Notifications — mocked */}
          <div>
            <Label className="mb-4 block">Notifications</Label>
            <div className="border border-[#3a352d] bg-[#1a1815]">
              {[["New matches","Notify when you receive a mutual interest"],["New messages","Notify when a match messages you"],["Event reminders","48hr notice before events you've RSVP'd"]].map(([label,desc],i,arr)=>(
                <div key={label} className={`flex items-center justify-between px-5 py-4 ${i<arr.length-1?"border-b border-[#3a352d]":""}`}>
                  <div><div className="font-display">{label}</div><div className="text-[#5a5349] text-xs mt-0.5">{desc}</div></div>
                  <div className="w-10 h-6 bg-[#c4956c]/20 border border-[#c4956c]/40 rounded-full flex items-center px-1 cursor-pointer"><div className="w-4 h-4 bg-[#c4956c] rounded-full ml-auto"/></div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div>
            <Label className="mb-4 block">Account Actions</Label>
            <div className="space-y-3">
              <Btn variant="ghost" onClick={handleSignOut} className="w-full">
                <LogOut size={14}/> Sign Out
              </Btn>
              {!deleteConfirm
                ? <Btn variant="danger" onClick={()=>setDC(true)} className="w-full"><Trash2 size={14}/> Delete Account</Btn>
                : (
                  <div className="border border-[#8b5a5a]/40 bg-[#8b5a5a]/10 p-5 space-y-4">
                    <p className="font-display text-[#d4928f]">This will permanently delete your profile, matches, and messages. This cannot be undone.</p>
                    <div className="flex gap-3">
                      <Btn variant="danger" onClick={()=>{/* TODO: delete user */}} className="flex-1">Confirm Delete</Btn>
                      <Btn variant="ghost" onClick={()=>setDC(false)} className="flex-1">Cancel</Btn>
                    </div>
                  </div>
                )
              }
            </div>
          </div>

          <div className="pb-4"><Label>kbridge Members' Society · v0.3.0</Label></div>
        </div>
      </div>
    </AppShell>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PROVIDER + ROOT
// ─────────────────────────────────────────────────────────────────────────────

const AuthLoadingScreen = () => (
  <div className="min-h-screen bg-[#0e0d0b] flex items-center justify-center">
    <FontLoader/>
    <div className="font-display text-3xl text-[#3a352d]">kbridge<span className="italic text-[#c4956c]">.</span></div>
  </div>
);

// Any authenticated profile. Used for routes that BOTH admins and members
// should be able to reach (settings, profile).
const ProtectedRoute = ({children}) => {
  const {user,profile,loading} = useAuth();
  if(loading) return <AuthLoadingScreen/>;
  if(!user || !profile) return <Navigate to="/login" replace/>;
  return children;
};

// Member-only surfaces. Admins land here only when they've opted into
// "view as member" from /settings; otherwise they're sent to /admin so
// they don't accidentally use member features.
const MemberRoute = ({children}) => {
  const {user,profile,loading,adminAsMember} = useAuth();
  if(loading) return <AuthLoadingScreen/>;
  if(!user || !profile) return <Navigate to="/login" replace/>;
  if(profile.is_admin && !adminAsMember) return <Navigate to="/admin" replace/>;
  return children;
};

function AuthProvider({children}) {
  const [user,setUser]       = useState(null);
  const [profile,setProfile] = useState(null);
  const [loading,setLoading] = useState(true);
  const [adminAsMember,setAAM] = useState(() => {
    try { return localStorage.getItem("kbridge:adminAsMember") === "1"; } catch { return false; }
  });

  const setAdminAsMember = (v) => {
    setAAM(v);
    try { localStorage.setItem("kbridge:adminAsMember", v ? "1" : "0"); } catch {}
  };

  const loadProfile = async uid => {
    try {
      const {data} = await supabase.from("profiles").select("*").eq("id",uid).single();
      setProfile(data||null);
    } catch {
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if(user) await loadProfile(user.id);
  };

  useEffect(()=>{
    let mounted = true;
    let subscription;

    const bootstrap = async () => {
      try {
        const {data:{session}} = await supabase.auth.getSession();
        if(!mounted) return;

        if(session?.user){
          setUser(session.user);
          await loadProfile(session.user.id);
        }

        const authListener = supabase.auth.onAuthStateChange(async(_,nextSession)=>{
          if(nextSession?.user){
            setUser(nextSession.user);
            await loadProfile(nextSession.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        });

        subscription = authListener.data.subscription;
      } catch {
        if(mounted){
          setUser(null);
          setProfile(null);
        }
      } finally {
        if(mounted) setLoading(false);
      }
    };

    bootstrap();

    return()=>{
      mounted = false;
      subscription?.unsubscribe();
    };
  },[]);

  return (
    <AuthContext.Provider value={{user,profile,loading,refreshProfile,adminAsMember,setAdminAsMember}}>
      {children}
    </AuthContext.Provider>
  );
}

function AppStateProvider({children}) {
  const {user} = useAuth();
  const [correspondences,setCorrespondences] = useState([]);
  const [incomingCount,setIncomingCount] = useState(0);
  const [loading,setLoading] = useState(false);

  const refresh = async () => {
    if(!user) {
      setCorrespondences([]);
      setIncomingCount(0);
      return;
    }
    setLoading(true);
    try {
      const [conv, incoming] = await Promise.all([
        listCorrespondences(user.id),
        listIncomingRequests(user.id),
      ]);
      setCorrespondences(conv);
      setIncomingCount(incoming.length);
    } catch (e) {
      console.error("AppStateProvider refresh failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ refresh(); /* eslint-disable-line react-hooks/exhaustive-deps */ },[user?.id]);

  // Live: any new message in any of our matches → refresh inbox previews
  useEffect(()=>{
    if(!user) return;
    const matchIds = correspondences.map(c=>c.matchId);
    if(!matchIds.length) return;
    const unsub = subscribeToInbox(matchIds, ()=>{ refresh(); });
    return unsub;
  },[user?.id, correspondences.map(c=>c.matchId).join(",")]);

  // Live: incoming intro requests change → refresh count
  useEffect(()=>{
    if(!user) return;
    const unsub = subscribeToIncomingRequests(user.id, ()=>{ refresh(); });
    return unsub;
  },[user?.id]);

  return (
    <AppStateContext.Provider value={{correspondences, incomingCount, loading, refresh}}>
      {children}
    </AppStateContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <FontLoader/>
        <Routes>
          {/* Public — gated application flow */}
          <Route path="/"               element={<Landing/>}/>
          <Route path="/apply"          element={<Apply/>}/>
          <Route path="/status/:token"  element={<ApplicationStatus/>}/>
          <Route path="/signup/:token"  element={<Signup/>}/>
          <Route path="/login"          element={<Login/>}/>
          <Route path="/auth/callback"  element={<AuthCallback/>}/>

          {/* Public — legal */}
          <Route path="/privacy"        element={<Legal doc="privacy"/>}/>
          <Route path="/terms"          element={<Legal doc="terms"/>}/>

          {/* Legacy public paths — keep working but redirect to the new flow */}
          <Route path="/auth"       element={<Navigate to="/login" replace/>}/>
          <Route path="/onboarding" element={<Navigate to="/apply"  replace/>}/>

          {/* Member-only (admins are bounced to /admin unless they've
              toggled "View as member" in /settings). */}
          <Route path="/discover"                element={<MemberRoute><DiscoverPage/></MemberRoute>}/>
          <Route path="/introductions"           element={<MemberRoute><IntroductionsInboxPage/></MemberRoute>}/>
          <Route path="/correspondence"          element={<MemberRoute><ThreadsPage/></MemberRoute>}/>
          <Route path="/correspondence/:matchId" element={<MemberRoute><ChatPage/></MemberRoute>}/>
          {/* Legacy /threads paths keep working */}
          <Route path="/threads"                 element={<Navigate to="/correspondence" replace/>}/>
          <Route path="/threads/:matchId"        element={<MemberRoute><ChatPage/></MemberRoute>}/>
          <Route path="/events"                  element={<MemberRoute><EventsPage/></MemberRoute>}/>

          {/* Available to both admins and members. */}
          <Route path="/profile"          element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}/>
          <Route path="/settings"         element={<ProtectedRoute><SettingsPage/></ProtectedRoute>}/>

          {/* Committee — AdminPanel does its own is_admin check */}
          <Route path="/admin" element={<AdminPanel/>}/>

          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </AppStateProvider>
    </AuthProvider>
  );
}
