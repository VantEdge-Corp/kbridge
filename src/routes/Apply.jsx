// ─────────────────────────────────────────────────────────────────────────────
// Apply.jsx — Public application form. Profession-oriented with mandatory
// photo + US passport upload. No auth required.
//
// Submit flow:
//   1. Upload face photo to Supabase Storage (verifications/{uuid}-face.*)
//   2. Upload passport photo (verifications/{uuid}-passport.*)
//   3. Insert applications row with the two storage paths
//   4. Redirect to /status/:token
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Upload, X as XIcon, Loader2 } from "lucide-react";

import { submitApplication } from "../lib/applications.js";
import { uploadVerification } from "../lib/storage.js";
import { computeFaceMatch, loadFaceModels, classifyMatch } from "../lib/face-match.js";
import {
  Shell, Label, Btn, TextField, TextArea, ErrorBanner,
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
  if (fields.linkedin_url && !/^https?:\/\//i.test(fields.linkedin_url)) {
    errs.linkedin_url = "Include the full URL (https://…).";
  }
  if (fields.years_experience && (fields.years_experience < 0 || fields.years_experience > 80)) {
    errs.years_experience = "Out of range.";
  }

  if (!fields.facePhotoFile) errs.facePhotoFile = "Required.";
  if (!fields.passportPhotoFile) errs.passportPhotoFile = "Required.";

  if (!fields.why?.trim()) errs.why = "Required.";
  else if (fields.why.length < 40) errs.why = "A few sentences, at least.";

  return errs;
}

function PhotoField({ label, hint, file, onPick, error }) {
  const inputRef = useRef(null);
  const previewUrl = file ? URL.createObjectURL(file) : null;

  return (
    <div className="space-y-3">
      <Label>{label}<span className="text-[#c4956c] ml-1">*</span></Label>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5349] leading-relaxed">
        {hint}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => onPick(e.target.files?.[0] ?? null)}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border border-dashed border-[#3a352d] hover:border-[#c4956c] transition-colors py-8 flex flex-col items-center gap-3 text-[#8a7f6a] hover:text-[#c4956c]"
        >
          <Upload size={16} />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Choose a file</span>
          <span className="font-mono text-[9px] text-[#5a5349]">JPEG, PNG, or WebP · max 8 MB</span>
        </button>
      ) : (
        <div className="border border-[#3a352d] p-4 flex items-center gap-4">
          <div className="w-20 h-20 bg-[#1a1410] overflow-hidden flex-shrink-0">
            <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-sm text-[#e8e0d0] truncate">{file.name}</div>
            <div className="font-mono text-[10px] text-[#5a5349] mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          <button
            type="button"
            onClick={() => { onPick(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="text-[#8a7f6a] hover:text-[#d4928f] p-2"
            aria-label="Remove"
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {error && <p className="font-mono text-[10px] text-[#d4928f]">{error}</p>}
    </div>
  );
}

// Compact status row beneath the two photo fields. Never blocks
// submission — the committee still decides. Just helps the applicant
// see why something might be flagged.
function FaceMatchStatus({ state }) {
  if (!state) return null;

  if (state === "computing") {
    return (
      <div className="border border-[#3a352d] bg-[#1a1815]/40 p-4 flex items-center gap-3">
        <Loader2 size={14} className="text-[#8a7f6a] animate-spin" />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a]">
          Comparing your selfie to your passport photo…
        </span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="border border-[#3a352d] bg-[#1a1815]/40 p-4 space-y-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#d4a47c]">
          Identity check: {state.error}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#5a5349]">
          You can still submit — the committee will review by hand.
        </div>
      </div>
    );
  }

  const v = classifyMatch(state.distance);
  return (
    <div className="border border-[#3a352d] bg-[#1a1815]/40 p-4 flex items-baseline gap-3">
      <span
        className="font-mono text-[10px] uppercase tracking-[0.22em]"
        style={{ color: v.color }}
      >
        Identity check: {v.label}
      </span>
      <span className="font-mono text-[9px] text-[#5a5349]">
        distance {state.distance?.toFixed(3)}
      </span>
    </div>
  );
}

export default function Apply() {
  const navigate = useNavigate();
  const [fields, setFields] = useState({
    email: "", first_name: "", age: "", city: "",
    profession: "", company: "", linkedin_url: "", years_experience: "",
    school: "", degree: "",
    bio: "", why: "",
    facePhotoFile: null, passportPhotoFile: null,
  });
  const [trap, setTrap] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  // Face match state. Recomputes whenever either photo changes.
  // null = not yet computed, "computing" = in-flight, otherwise the result object.
  const [faceMatch, setFaceMatch] = useState(null);

  // Kick off model load on mount so it's likely ready by the time
  // both photos are picked. Errors are swallowed — the actual call
  // in computeFaceMatch will surface them.
  useEffect(() => {
    loadFaceModels().catch(() => {});
  }, []);

  // Recompute the score whenever both photos exist.
  useEffect(() => {
    if (!fields.facePhotoFile || !fields.passportPhotoFile) {
      setFaceMatch(null);
      return;
    }
    let cancelled = false;
    setFaceMatch("computing");
    (async () => {
      const result = await computeFaceMatch(fields.facePhotoFile, fields.passportPhotoFile);
      if (!cancelled) setFaceMatch(result);
    })();
    return () => { cancelled = true; };
  }, [fields.facePhotoFile, fields.passportPhotoFile]);

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
      setStage("Uploading face photo…");
      const face_photo_path = await uploadVerification(fields.facePhotoFile, "face");

      setStage("Uploading passport photo…");
      const passport_photo_path = await uploadVerification(fields.passportPhotoFile, "passport");

      setStage("Submitting application…");
      const face_match = (faceMatch && typeof faceMatch === "object") ? faceMatch : null;
      const { status_token } = await submitApplication({
        email:               fields.email,
        first_name:          fields.first_name,
        age:                 fields.age ? parseInt(fields.age, 10) : null,
        city:                fields.city,
        profession:          fields.profession,
        company:             fields.company,
        linkedin_url:        fields.linkedin_url,
        years_experience:    fields.years_experience ? parseInt(fields.years_experience, 10) : null,
        school:              fields.school,
        degree:              fields.degree,
        bio:                 fields.bio,
        why:                 fields.why,
        face_photo_path,
        passport_photo_path,
        face_match,
      });

      navigate(`/status/${status_token}`, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
      setStage("");
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
            We verify identity by hand from your photo and a US passport before
            approving accounts. Submit once, you'll hear back within a few days.
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
                {touched && errors.linkedin_url && <p className="font-mono text-[10px] text-[#d4928f] mt-1">{errors.linkedin_url}</p>}
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

          {/* III — Identity */}
          <section className="space-y-8">
            <div>
              <Label>III — Identity</Label>
              <p className="font-display italic text-[#a89d87] text-sm mt-2 leading-relaxed">
                Two images. The committee reviews them by hand. Stored privately —
                only admins can view, and only while your application is open.
              </p>
            </div>

            <PhotoField
              label="Clear photo of your face"
              hint="A recent photo, neutral lighting, no sunglasses or hat. Phone selfie is fine."
              file={fields.facePhotoFile}
              onPick={(f) => update("facePhotoFile", f)}
              error={touched && errors.facePhotoFile}
            />

            <PhotoField
              label="US passport"
              hint="The photo page of a current US passport. Make sure the name and photo are readable."
              file={fields.passportPhotoFile}
              onPick={(f) => update("passportPhotoFile", f)}
              error={touched && errors.passportPhotoFile}
            />

            {/* Face-match status — appears once both photos are picked. */}
            {fields.facePhotoFile && fields.passportPhotoFile && (
              <FaceMatchStatus state={faceMatch} />
            )}
          </section>

          {/* IV — About */}
          <section className="space-y-6">
            <Label>IV — About you</Label>

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

          {error && <ErrorBanner>{error}</ErrorBanner>}

          <div className="pt-6 border-t border-[#3a352d] flex items-center justify-between gap-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5349] leading-relaxed">
              {submitting && stage
                ? stage
                : "Reviewed within a few days · No account until approved"}
            </div>
            <Btn variant="primary" type="submit" disabled={!canSubmit}>
              {submitting ? "Submitting…" : <>Submit application <ArrowRight size={14} /></>}
            </Btn>
          </div>

          <p className="font-mono text-[9px] text-[#5a5349] uppercase tracking-[0.18em] flex items-center gap-2">
            <Check size={10} /> Photos are private. We never sell, publish, or repost them.
          </p>
        </form>
      </div>
    </Shell>
  );
}
