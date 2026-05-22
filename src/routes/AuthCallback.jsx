// ─────────────────────────────────────────────────────────────────────────────
// AuthCallback.jsx — Lands the magic-link redirect and resolves the session.
//
// When supabase-js processes the URL hash, it fires onAuthStateChange. If the
// applicant's email has no approved application, the handle_new_user trigger
// raises and the session never establishes — we surface a clear error rather
// than a stuck spinner.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { supabase } from "../lib/supabase.js";
import { Shell, Label, Btn, ErrorBanner } from "../components/ui.jsx";

const SETTLE_TIMEOUT_MS = 8000;

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let unsub;

    const settle = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        navigate("/discover", { replace: true });
      }
    };
    settle();

    const listener = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user) navigate("/discover", { replace: true });
    });
    unsub = listener.data.subscription;

    const timer = setTimeout(() => {
      if (cancelled) return;
      setError(
        "We couldn't establish a session from that link. This usually means your application hasn't been approved yet, or the link has expired."
      );
    }, SETTLE_TIMEOUT_MS);

    return () => {
      cancelled = true;
      unsub?.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <Shell>
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-up">
          <Label>Members' Society</Label>
          <h1 className="font-display text-4xl italic text-[#c4956c]">One moment.</h1>
          {error ? (
            <>
              <ErrorBanner>{error}</ErrorBanner>
              <div className="flex gap-3 justify-center">
                <Btn variant="ghost" onClick={() => navigate("/login")}>Back to sign in</Btn>
                <Btn variant="outline" onClick={() => navigate("/apply")}>Apply</Btn>
              </div>
            </>
          ) : (
            <p className="font-display italic text-[#a89d87]">Signing you in…</p>
          )}
          <Link
            to="/"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a] hover:text-[#e8e0d0] inline-flex items-center gap-2"
          >
            <ArrowLeft size={12} /> Home
          </Link>
        </div>
      </div>
    </Shell>
  );
}
