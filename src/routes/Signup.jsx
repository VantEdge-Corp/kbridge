// ─────────────────────────────────────────────────────────────────────────────
// Signup.jsx — Post-approval account creation.
//
// Reached from /status/:token once the application is approved. We
// pre-fill the email from the approved application (via the
// get_application_for_signup RPC) and ask the applicant to choose
// a password. supabase.auth.signUp triggers handle_new_user, which
// only allows the row to land if an approved application exists for
// the email — so signing up with a different email than what was
// approved will fail at the database level.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { supabase } from "../lib/supabase.js";
import { getApplicationForSignup } from "../lib/applications.js";
import { Shell, Label, Btn, TextField, ErrorBanner } from "../components/ui.jsx";

const MIN_PASSWORD = 6;

export default function Signup() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [app, setApp] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const record = await getApplicationForSignup(token);
        if (cancelled) return;
        if (!record) {
          setLoadError("This signup link is invalid or your application is not yet approved.");
        } else {
          setApp(record);
          setEmail(record.email);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.message || "Could not load application.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const passwordsMatch = password.length > 0 && password === confirm;
  const passwordOk = password.length >= MIN_PASSWORD;
  const canSubmit = !busy && email && passwordOk && passwordsMatch;

  const submit = async (e) => {
    e?.preventDefault();
    setTouched(true);
    setError("");
    if (!canSubmit) return;

    setBusy(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      // If the project has email confirmation enabled, signUp returns a
      // user but no session. Send them to /login with a clear message.
      if (!data.session) {
        navigate("/login?confirm=1", { replace: true });
        return;
      }

      navigate("/discover", { replace: true });
    } catch (err) {
      setError(err.message || "Could not create your account.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="min-h-screen flex items-center justify-center"><Label>Loading…</Label></div>
      </Shell>
    );
  }

  if (loadError) {
    return (
      <Shell>
        <div className="max-w-xl mx-auto px-8 py-16 space-y-8 animate-fade-up">
          <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a] hover:text-[#e8e0d0] flex items-center gap-2">
            <ArrowLeft size={12} /> Home
          </Link>
          <ErrorBanner>{loadError}</ErrorBanner>
          <div className="flex gap-3">
            <Btn variant="ghost" onClick={() => navigate("/apply")}>Submit a new application</Btn>
            <Btn variant="outline" onClick={() => navigate("/login")}>Sign in</Btn>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-xl mx-auto px-8 py-16 space-y-12 animate-fade-up">
        <header className="flex justify-between items-center border-b border-[#3a352d] pb-6">
          <Link to="/" className="font-display text-xl">
            kbridge<span className="italic text-[#c4956c]">.</span>
          </Link>
          <Label>Create your account</Label>
        </header>

        <div className="space-y-6">
          <Label className="!text-[#c4956c]">Admitted</Label>
          <h1 className="font-display text-4xl md:text-5xl leading-tight">
            {app?.first_name ? `${app.first_name}, ` : ""}
            <em className="italic text-[#c4956c]">welcome to kbridge.</em>
          </h1>
          <p className="font-display italic text-lg text-[#a89d87] leading-relaxed">
            Choose a password to create your account. You'll use this email and password to sign in.
          </p>
        </div>

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
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#5a5349] -mt-6">
            Pre-filled from your application. Changing it will fail unless that email has also been approved.
          </p>

          <TextField
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder={`At least ${MIN_PASSWORD} characters`}
            type="password"
            autoComplete="new-password"
            required
          />
          {touched && password && !passwordOk && (
            <p className="font-mono text-[10px] text-[#d4928f] -mt-6">
              Use at least {MIN_PASSWORD} characters.
            </p>
          )}

          <TextField
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Re-enter your password"
            type="password"
            autoComplete="new-password"
            required
          />
          {touched && confirm && !passwordsMatch && (
            <p className="font-mono text-[10px] text-[#d4928f] -mt-6">
              Passwords don't match.
            </p>
          )}

          {error && <ErrorBanner>{error}</ErrorBanner>}

          <div className="pt-6 border-t border-[#3a352d] flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#5a5349] flex items-center gap-2">
              <Check size={10} /> Approved by the committee
            </p>
            <Btn variant="primary" type="submit" disabled={!canSubmit}>
              {busy ? "Creating account…" : <>Create account <ArrowRight size={14} /></>}
            </Btn>
          </div>
        </form>
      </div>
    </Shell>
  );
}
