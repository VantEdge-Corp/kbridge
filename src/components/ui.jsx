// ─────────────────────────────────────────────────────────────────────────────
// ui.jsx — Shared editorial primitives used by routes outside the App.jsx
// monolith (Apply, ApplicationStatus, Login, AuthCallback). Keeps the
// kbridge aesthetic consistent: Fraunces serif + JetBrains Mono, warm dark
// palette, hairline rules, grain overlay.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { Check } from "lucide-react";

export const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,600&family=JetBrains+Mono:wght@300;400;500&display=swap');
    *{box-sizing:border-box;}
    .font-display{font-family:'Fraunces','Times New Roman',serif;font-optical-sizing:auto;}
    .font-mono{font-family:'JetBrains Mono',monospace;}
    .editorial-rule{background:linear-gradient(90deg,transparent,#3a352d 20%,#3a352d 80%,transparent);}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    .animate-fade-up{animation:fadeUp .5s ease-out both;}
    .grain::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.08;
      background-image:
        radial-gradient(circle at 20% 20%, rgba(255,255,255,.08) 0 0.6px, transparent 0.8px),
        radial-gradient(circle at 80% 30%, rgba(255,255,255,.05) 0 0.7px, transparent 0.9px),
        radial-gradient(circle at 40% 70%, rgba(255,255,255,.06) 0 0.6px, transparent 0.8px);
      background-size:18px 18px, 24px 24px, 22px 22px;
      background-position:0 0, 7px 11px, 13px 5px;}
    input,textarea,select{font-family:'Fraunces',serif;}
    input:focus,textarea:focus,select:focus{outline:none;}
    html,body,#root{margin:0;padding:0;background:#0e0d0b;min-height:100vh;}
  `}</style>
);

export const Label = ({ children, className = "" }) => (
  <span className={`font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a] ${className}`}>
    {children}
  </span>
);

export const Rule = ({ className = "" }) => (
  <div className={`h-px editorial-rule ${className}`} />
);

export const Btn = ({
  children, onClick, variant = "primary", className = "", disabled = false, type = "button",
}) => {
  const base =
    "font-mono text-[11px] uppercase tracking-[0.22em] px-7 py-4 transition-all duration-300 inline-flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-[#c4956c] text-[#0e0d0b] hover:bg-[#d4a47c]",
    ghost:   "border border-[#3a352d] text-[#e8e0d0] hover:border-[#c4956c] hover:text-[#c4956c]",
    outline: "border border-[#c4956c] text-[#c4956c] hover:bg-[#c4956c] hover:text-[#0e0d0b]",
    danger:  "border border-[#8b5a5a]/60 text-[#d4928f] hover:bg-[#8b5a5a]/20",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {children}
    </button>
  );
};

export const TextField = ({
  label, value, onChange, placeholder, type = "text", autoComplete = "", required = false,
}) => (
  <div className="space-y-2">
    {label && <Label>{label}{required && <span className="text-[#c4956c] ml-1">*</span>}</Label>}
    <input
      type={type}
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
      className="w-full bg-transparent border-b border-[#3a352d] pb-3 text-[#e8e0d0] font-display text-lg placeholder:text-[#5a5349] focus:border-[#c4956c] transition-colors"
    />
  </div>
);

export const TextArea = ({
  label, value, onChange, placeholder, rows = 4, required = false, maxLength,
}) => (
  <div className="space-y-2">
    {label && (
      <div className="flex items-baseline justify-between">
        <Label>{label}{required && <span className="text-[#c4956c] ml-1">*</span>}</Label>
        {maxLength && (
          <span className="font-mono text-[9px] text-[#5a5349]">
            {(value?.length ?? 0)}/{maxLength}
          </span>
        )}
      </div>
    )}
    <textarea
      rows={rows}
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      className="w-full bg-transparent border-b border-[#3a352d] pb-3 text-[#e8e0d0] font-display text-base placeholder:text-[#5a5349] focus:border-[#c4956c] transition-colors resize-none"
    />
  </div>
);

// Clickwrap consent checkbox — unchecked by default, affirmative action
// required. `children` carries the label (with hyperlinks to the documents).
export const Checkbox = ({ checked, onChange, children }) => (
  <label className="flex items-start gap-3 cursor-pointer select-none">
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`mt-0.5 w-5 h-5 flex-shrink-0 border flex items-center justify-center transition-colors ${
        checked ? "bg-[#c4956c] border-[#c4956c]" : "border-[#3a352d] hover:border-[#c4956c]"
      }`}
    >
      {checked && <Check size={13} className="text-[#0e0d0b]" strokeWidth={3} />}
    </button>
    <span className="font-display text-[15px] text-[#a89d87] leading-snug">{children}</span>
  </label>
);

export const Shell = ({ children }) => (
  <div className="min-h-screen bg-[#0e0d0b] text-[#e8e0d0] grain relative">
    <FontLoader />
    {children}
  </div>
);

export const ErrorBanner = ({ children }) => (
  <div className="border border-[#8b5a5a]/40 bg-[#8b5a5a]/10 p-4 text-[#d4928f] text-sm">
    {children}
  </div>
);
