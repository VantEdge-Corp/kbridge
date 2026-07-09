// ─────────────────────────────────────────────────────────────────────────────
// Apply.jsx — Public application form. No auth required.
//
// Membership is decided by committee review of the written application (see the
// admin panel). kbridge does not collect government IDs or run identity
// verification, so nothing sensitive is uploaded here.
//
// Submit flow:
//   1. Validate fields + require the two consents (18+, Terms/Privacy).
//   2. Insert the applications row with the accepted document versions.
//   3. Redirect to /status/:token.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { submitApplication } from "../lib/applications.js";
import { LEGAL_VERSIONS } from "../lib/legal.js";
import {
  Shell, Label, Btn, TextField, TextArea, ErrorBanner, Checkbox,
} from "../components/ui.jsx";

const WHY_MAX = 600;
const SUMMARY_MAX = 320;

function validate(fields) {
  const errs = {};

  if (!fields.email?.trim()) errs.email = "Required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errs.email = "Doesn't look like an email.";
  if (!fields.first_name?.trim()) errs.first_name = "Required.";
  if (fields.age && (fields.age < 18 || fields.age > 120)) errs.age = "Must be 18+.";

  if (!fields.profession?.trim()) errs.profession = "Required.";
  if (!fields.company?.trim()) errs.company = "Required.";
  if (fields.years_experience && (fields.years_experience < 0 || fields.years_experience > 80)) {
    errs.years_experience = "Out of range.";
  }

  if (!fields.why?.trim()) errs.why = "Required.";

  // Consent is mandatory and unbundled — each box is its own gate.
  if (!fields.age18) errs.age18 = "Required.";
  if (!fields.agreeTerms) errs.agreeTerms = "Required.";

  return errs;
}

const DocLink = ({ to, children }) => (
  <a href={to} target="_blank" rel="noreferrer" className="text-[#c4956c] underline underline-offset-2 hover:text-[#d4a47c]">
    {children}
  </a>
);

export default function Apply() {
  const navigate = useNavigate();
  const [fields, setFields] = useState({
    email: "", first_name: "", age: "", city: "",
    profession: "", company: "", linkedin_url: "", years_experience: "",
    school: "", degree: "",
    bio: "", why: "",
    age18: false, agreeTerms: false,
  });
  const [trap, setTrap] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (k, v) => setFields(prev => ({ ...prev, [k]: v }));

  const errors = validate(fields);
  const canSubmit = Object.keys(errors).length === 0 && !submitting;

  const onSubmit = async (e) => {
    e?.preventDefault();
    setTouched(true);
    setError("");
    if (trap) return;
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const { status_token } = await submitApplication({
        email:            fields.email,
        first_name:       fields.first_name,
        age:              fields.age ? parseInt(fields.age, 10) : null,
        city:             fields.city,
        profession:       fields.profession,
        company:          fields.company,
        linkedin_url:     fields.linkedin_url,
        years_experience: fields.years_experience ? parseInt(fields.years_experience, 10) : null,
        school:           fields.school,
        degree:           fields.degree,
        bio:              fields.bio,
        why:              fields.why,
        consent: {
          ageConfirmed:   fields.age18,
          termsVersion:   LEGAL_VERSIONS.terms,
          privacyVersion: LEGAL_VERSIONS.privacy,
        },
      });

      navigate(`/status/${status_token}`, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-2xl mx-auto px-8 py-8">

        <header className="flex justify-between items-center border-b border-[#3a352d] pb-6">
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

        <div className="mt-16 animate-fade-up">
          <Label>The Application</Label>
          <h1 className="font-display text-4xl md:text-5xl mt-4 leading-tight">
            Short, specific,<br />
            <em className="italic text-[#c4956c]">read by hand.</em>
          </h1>
          <p className="font-display italic text-lg text-[#a89d87] mt-4 max-w-xl leading-relaxed">
            Tell us who you are. Every application is read by hand and reviewed by
            the committee — you'll hear back within a few days.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-12 space-y-12" noValidate>

          {/* Honeypot */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
            <label>
              Do not fill this field
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={trap}
                onChange={e => setTrap(e.target.value)}
              />
            </label>
          </div>

          {/* I — Contact */}
          <section className="space-y-6">
            <Label>I — Contact</Label>
            <TextField
              label="Email"
              value={fields.email}
              onChange={v => update("email", v)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              required
            />
            {touched && errors.email && <p className="font-mono text-[10px] text-[#d4928f]">{errors.email}</p>}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <TextField
                  label="First name"
                  value={fields.first_name}
                  onChange={v => update("first_name", v)}
                  placeholder="Jane"
                  required
                />
                {touched && errors.first_name && <p className="font-mono text-[10px] text-[#d4928f] mt-1">{errors.first_name}</p>}
              </div>
              <div>
                <TextField
                  label="Age"
                  value={fields.age}
                  onChange={v => update("age", v.replace(/[^0-9]/g, ""))}
                  placeholder="29"
                />
                {touched && errors.age && <p className="font-mono text-[10px] text-[#d4928f] mt-1">{errors.age}</p>}
              </div>
            </div>

            <TextField
              label="City"
              value={fields.city}
              onChange={v => update("city", v)}
              placeholder="New York"
            />
          </section>

          {/* II — Profession */}
          <section className="space-y-6">
            <Label>II — Profession</Label>

            <div>
              <TextField
                label="Current role"
                value={fields.profession}
                onChange={v => update("profession", v)}
                placeholder="Senior Architect"
                required
              />
              {touched && errors.profession && <p className="font-mono text-[10px] text-[#d4928f] mt-1">{errors.profession}</p>}
            </div>

            <div>
              <TextField
                label="Company or firm"
                value={fields.company}
                onChange={v => update("company", v)}
                placeholder="SOM"
                required
              />
              {touched && errors.company && <p className="font-mono text-[10px] text-[#d4928f] mt-1">{errors.company}</p>}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <TextField
                  label="Years of experience"
                  value={fields.years_experience}
                  onChange={v => update("years_experience", v.replace(/[^0-9]/g, ""))}
                  placeholder="6"
                />
                {touched && errors.years_experience && <p className="font-mono text-[10px] text-[#d4928f] mt-1">{errors.years_experience}</p>}
              </div>
              <div>
                <TextField
                  label="LinkedIn URL"
                  value={fields.linkedin_url}
                  onChange={v => update("linkedin_url", v)}
                  placeholder="https://linkedin.com/in/…"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <TextField
                label="Degree (optional)"
                value={fields.degree}
                onChange={v => update("degree", v)}
                placeholder="M.Arch"
              />
              <TextField
                label="School (optional)"
                value={fields.school}
                onChange={v => update("school", v)}
                placeholder="Yale"
              />
            </div>
          </section>

          {/* III — About */}
          <section className="space-y-6">
            <Label>III — About you</Label>

            <TextArea
              label="Brief professional summary"
              value={fields.bio}
              onChange={v => update("bio", v)}
              placeholder="A sentence or two on what you actually do."
              rows={3}
              maxLength={SUMMARY_MAX}
            />

            <TextArea
              label="Why kbridge"
              value={fields.why}
              onChange={v => update("why", v)}
              placeholder="The part of why you're here that's true even when it's embarrassing. The committee reads this twice."
              rows={5}
              maxLength={WHY_MAX}
              required
            />
            {touched && errors.why && <p className="font-mono text-[10px] text-[#d4928f]">{errors.why}</p>}
          </section>

          {/* IV — Consent (clickwrap; each box is its own gate) */}
          <section className="space-y-5">
            <Label>IV — Consent</Label>

            <Checkbox checked={fields.age18} onChange={v => update("age18", v)}>
              I am 18 years of age or older.
            </Checkbox>
            {touched && errors.age18 && <p className="font-mono text-[10px] text-[#d4928f] ml-8">{errors.age18}</p>}

            <Checkbox checked={fields.agreeTerms} onChange={v => update("agreeTerms", v)}>
              I have read and agree to the <DocLink to="/terms">Terms of Service</DocLink> and{" "}
              <DocLink to="/privacy">Privacy Policy</DocLink>.
            </Checkbox>
            {touched && errors.agreeTerms && <p className="font-mono text-[10px] text-[#d4928f] ml-8">{errors.agreeTerms}</p>}
          </section>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          <div className="pt-6 border-t border-[#3a352d] flex items-center justify-between gap-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5349] leading-relaxed">
              {submitting
                ? "Submitting…"
                : "Reviewed within a few days · No account until approved"}
            </div>
            <Btn variant="primary" type="submit" disabled={!canSubmit}>
              {submitting ? "Submitting…" : <>Submit application <ArrowRight size={14} /></>}
            </Btn>
          </div>

          <p className="font-mono text-[9px] text-[#5a5349] uppercase tracking-[0.18em] flex items-center gap-2">
            <Check size={10} /> Your information is private. We never sell it.
          </p>
        </form>
      </div>
    </Shell>
  );
}
