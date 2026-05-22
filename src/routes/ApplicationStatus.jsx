// ─────────────────────────────────────────────────────────────────────────────
// ApplicationStatus.jsx — Public status page indexed by status_token.
//
// Uses the get_application_status RPC, which collapses internally-rejected
// applications back to 'pending'. The applicant therefore never learns from
// this surface that their application was declined (silent-decline policy).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, Check, Sparkles } from "lucide-react";

import { getApplicationStatusByToken } from "../lib/applications.js";
import { Shell, Label, Btn, ErrorBanner } from "../components/ui.jsx";

function fmt(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  } catch {
    return "";
  }
}

const STATUS_VIEW = {
  pending: {
    icon: Clock,
    eyebrow: "Under review",
    title: "Your application is with the committee.",
    body: "We read every application personally. You'll hear from us once a decision has been made — typically within a few days.",
    cta: null,
  },
  waitlisted: {
    icon: Clock,
    eyebrow: "Deferred",
    title: "We'd like a bit more time.",
    body: "The committee has placed your application on a brief hold. We'll be in touch.",
    cta: null,
  },
  approved: {
    icon: Sparkles,
    eyebrow: "Admitted",
    title: "Welcome.",
    body: "Your application has been accepted. Continue to set up your account — you'll choose a password and use it to sign in from now on.",
    // ':signup' is resolved at render time using the route's :token param.
    cta: { label: "Create your account", to: ":signup" },
  },
  claimed: {
    icon: Check,
    eyebrow: "Active member",
    title: "You're a member.",
    body: "Your credentials have already been claimed. Sign in to enter.",
    cta: { label: "Sign in", to: "/login" },
  },
};

export default function ApplicationStatus() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, status: null, error: "", record: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const record = await getApplicationStatusByToken(token);
        if (cancelled) return;
        if (!record) {
          setState({ loading: false, status: null, error: "We couldn't find that application.", record: null });
        } else {
          setState({ loading: false, status: record.status, error: "", record });
        }
      } catch (err) {
        if (cancelled) return;
        setState({ loading: false, status: null, error: err.message || "Something went wrong.", record: null });
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (state.loading) {
    return (
      <Shell>
        <div className="min-h-screen flex items-center justify-center">
          <Label>Loading…</Label>
        </div>
      </Shell>
    );
  }

  if (state.error || !state.status) {
    return (
      <Shell>
        <div className="max-w-xl mx-auto px-8 py-16 space-y-8 animate-fade-up">
          <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a] hover:text-[#e8e0d0] flex items-center gap-2">
            <ArrowLeft size={12} /> Home
          </Link>
          <ErrorBanner>{state.error || "Unknown application."}</ErrorBanner>
          <div>
            <Btn variant="ghost" onClick={() => navigate("/apply")}>Submit a new application</Btn>
          </div>
        </div>
      </Shell>
    );
  }

  const view = STATUS_VIEW[state.status] ?? STATUS_VIEW.pending;
  const Icon = view.icon;

  return (
    <Shell>
      <div className="max-w-xl mx-auto px-8 py-16 space-y-12 animate-fade-up">
        <header className="flex justify-between items-center border-b border-[#3a352d] pb-6">
          <Link to="/" className="font-display text-xl">
            kbridge<span className="italic text-[#c4956c]">.</span>
          </Link>
          <Label>Application status</Label>
        </header>

        <div className="space-y-6">
          <div className="flex items-center gap-3 text-[#c4956c]">
            <Icon size={16} />
            <Label className="!text-[#c4956c]">{view.eyebrow}</Label>
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight">
            {state.record?.first_name ? `${state.record.first_name}, ` : ""}
            <em className="italic text-[#c4956c]">{view.title}</em>
          </h1>
          <p className="font-display italic text-lg text-[#a89d87] leading-relaxed">{view.body}</p>
          {state.record?.created_at && (
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#5a5349]">
              Submitted {fmt(state.record.created_at)}
            </p>
          )}
        </div>

        {view.cta && (
          <div className="pt-6 border-t border-[#3a352d]">
            <Btn
              variant="primary"
              onClick={() => navigate(view.cta.to === ":signup" ? `/signup/${token}` : view.cta.to)}
            >
              {view.cta.label} <ArrowRight size={14} />
            </Btn>
          </div>
        )}

        <p className="font-mono text-[9px] text-[#5a5349] uppercase tracking-[0.18em]">
          Bookmark this page to return.
        </p>
      </div>
    </Shell>
  );
}
