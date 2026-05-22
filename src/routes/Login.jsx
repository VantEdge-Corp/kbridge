// ─────────────────────────────────────────────────────────────────────────────
// Login.jsx — Email + password sign-in.
//
// Members set their password on /signup/:token after approval. Admins
// use the credentials seeded by supabase/seed_admin.sql. The gate is
// enforced by handle_new_user, which only creates a profile (and
// therefore allows the auth.users row to live) when an approved
// application exists for the email — so no account can exist that
// wasn't admitted by the committee.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";

import { supabase } from "../lib/supabase.js";
import { Shell, Label, Btn, TextField, ErrorBanner } from "../components/ui.jsx";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmHint, setConfirmHint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.user) navigate("/discover", { replace: true });
    });
    return () => { cancelled = true; };
  }, [navigate]);

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    if (qp.get("email")) setEmail(qp.get("email"));
    if (qp.get("confirm") === "1") setConfirmHint(true);
  }, [location.search]);

  const canSubmit = !busy && EMAIL_RX.test(email) && password.length > 0;

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    if (!canSubmit) return;
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email, password,
      });
      if (signInError) throw signInError;
      navigate("/discover", { replace: true });
    } catch (err) {
      setError(err.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-[#3a352d] px-8 py-5 flex items-center justify-between">
          <Link to="/" className="font-display text-xl">
            kbridge<span className="italic text-[#c4956c]">.</span>
          </Link>
          <Link
            to="/"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a] hover:text-[#e8e0d0] flex items-center gap-2"
          >
            <ArrowLeft size={12} /> Home
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md animate-fade-up">
            <div className="text-center mb-12">
              <div className="font-display text-4xl mb-2">Welcome.</div>
              <Label>Members' Society</Label>
            </div>

            {confirmHint && (
              <div className="mb-8 border border-[#c4956c]/40 bg-[#c4956c]/5 p-4 text-[#c4956c] text-sm flex items-start gap-3">
                <Mail size={14} className="mt-0.5 flex-shrink-0" />
                <span className="font-display italic">
                  Your account was created. Check your inbox to confirm your email, then sign in here.
                </span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-8">
              <TextField
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                required
              />

              <TextField
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="••••••"
                type="password"
                autoComplete="current-password"
                required
              />

              {error && <ErrorBanner>{error}</ErrorBanner>}

              <Btn
                variant="primary"
                type="submit"
                disabled={!canSubmit}
                className="w-full"
              >
                {busy ? "One moment…" : <>Sign in <ArrowRight size={14} /></>}
              </Btn>

              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#5a5349] text-center">
                No account yet?{" "}
                <Link to="/apply" className="text-[#c4956c] hover:text-[#d4a47c]">Apply for membership →</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </Shell>
  );
}
