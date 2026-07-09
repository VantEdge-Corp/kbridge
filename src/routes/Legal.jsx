// ─────────────────────────────────────────────────────────────────────────────
// Legal.jsx — Public renderer for the Privacy Policy and Terms of Service at
// /privacy and /terms. Content lives in src/lib/legal.js (single source of
// truth for wording + versions).
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Shell, Label, Rule } from "../components/ui.jsx";
import { DOCUMENTS, LEGAL_EFFECTIVE_DATE } from "../lib/legal.js";

export default function Legal({ doc }) {
  const document = DOCUMENTS[doc];

  if (!document) {
    return (
      <Shell>
        <div className="max-w-2xl mx-auto px-8 py-16">
          <Label>Document not found.</Label>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-2xl mx-auto px-8 py-12">
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

        <div className="mt-12 animate-fade-up">
          <Label>kbridge</Label>
          <h1 className="font-display text-4xl md:text-5xl mt-3 leading-tight">
            {document.title}
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#5a5349] mt-4">
            Effective {LEGAL_EFFECTIVE_DATE} · Version {document.version}
          </p>
        </div>

        <Rule className="my-8" />

        <p className="font-display text-[15px] text-[#a89d87] leading-relaxed">
          {document.intro}
        </p>

        <div className="mt-10 space-y-8">
          {document.sections.map((s) => (
            <section key={s.h} className="space-y-3">
              <h2 className="font-display text-xl text-[#e8e0d0]">{s.h}</h2>
              {s.p.map((para, i) => (
                <p key={i} className="font-display text-[15px] text-[#a89d87] leading-relaxed">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        <Rule className="my-10" />
        <div className="flex gap-6 pb-16">
          <Link to="/privacy" className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a] hover:text-[#c4956c]">Privacy</Link>
          <Link to="/terms" className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7f6a] hover:text-[#c4956c]">Terms</Link>
        </div>
      </div>
    </Shell>
  );
}
