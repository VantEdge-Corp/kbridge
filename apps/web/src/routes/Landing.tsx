import type { IconType } from 'react-icons';
import { LuBadgeCheck, LuBan, LuBriefcase, LuEyeOff, LuGraduationCap, LuLock, LuMapPin, LuUserCheck } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { BRAND, VERIFICATION_DIMENSIONS, VERIFICATION_LABEL, taglineParts } from '@peaches/core';
import { useAuth } from '@/auth/AuthProvider';
import { homeFor } from '@/auth/guards';
import { PublicFooter, PublicHeader } from '@/components/PublicChrome';
import { buttonVariants } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/usePageTitle';

const STEPS = [
  { numeral: 'I', title: 'Apply', body: 'A short application: who you are, what you do, and why you want to meet people this way. No photos or documents are needed to apply.' },
  { numeral: 'II', title: 'Committee review', body: 'Every application is read by a person, and most decisions take a few days. Your status is one link away the whole time.' },
  { numeral: 'III', title: 'Create your account', body: 'Once admitted, choose a password and complete your profile. From there you meet people through introductions, not browsing.' },
];

const VERIFICATION_COPY: Record<(typeof VERIFICATION_DIMENSIONS)[number], { body: string; icon: IconType }> = {
  identity: { body: 'That you are who your profile says you are.', icon: LuUserCheck },
  education: { body: 'The school and degree you list.', icon: LuGraduationCap },
  student: { body: 'Current enrollment, for students.', icon: LuBadgeCheck },
  employment: { body: 'Your occupation and employer.', icon: LuBriefcase },
};

const PRIVACY: ReadonlyArray<{ title: string; body: string; icon: IconType }> = [
  { title: 'Members only', body: 'Profiles are visible only to signed-in members. Nobody can be seen until they are admitted.', icon: LuLock },
  { title: 'Never your location', body: 'Others see an area such as “Duluth area,” never an address or a distance to the door.', icon: LuMapPin },
  { title: 'Share what you choose', body: 'Nationality, race or ethnicity, and lifestyle details are optional, and “prefer not to say” is always there. Nothing about you is ranked publicly.', icon: LuEyeOff },
  { title: 'Block and report', body: 'Block anyone at any time. Every report is read by a person within 24 hours.', icon: LuBan },
];

/** A kicker between two hairlines, as on the cover of a programme. */
function RuledKicker({ children }: { children: string }) {
  return (
    <p className="kicker flex items-center gap-3 text-muted-foreground">
      <span aria-hidden="true" className="h-px w-8 bg-foreground/15" />
      {children}
      <span aria-hidden="true" className="h-px w-8 bg-foreground/15" />
    </p>
  );
}

export function Landing() {
  usePageTitle();
  const { user, profile, adminAsMember } = useAuth();
  const signedIn = !!user && !!profile;
  const home = signedIn ? homeFor(profile, adminAsMember) : '/';
  const [before, emphasis, after] = taglineParts();
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader>
        {signedIn ? (
          <Link to={home} className={buttonVariants({ variant: 'ghost' })}>
            Open {BRAND.name}
          </Link>
        ) : (
          <>
            <Link to="/login" className={buttonVariants({ variant: 'ghost' })}>
              Sign in
            </Link>
            <Link to="/apply" className={buttonVariants()}>
              Apply
            </Link>
          </>
        )}
      </PublicHeader>

      <main className="flex-1">
        <section className="relative isolate overflow-hidden">
          {/* A soft light from above; it fades out well inside its box, so it never shows an edge. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] bg-spotlight" />
          <div className="mx-auto flex max-w-[920px] flex-col items-center px-4 pt-24 pb-24 text-center md:pt-36 md:pb-32">
            <RuledKicker>{`Members only · ${BRAND.market}`}</RuledKicker>
            <h1 className="mt-8 font-display text-[3.75rem] leading-[0.98] font-medium tracking-[-0.01em] text-balance sm:text-7xl md:text-[6.5rem]">
              {before}
              <em>{emphasis}</em>
              {after}
            </h1>
            <p className="mt-8 max-w-[50ch] leading-relaxed text-muted-foreground text-pretty sm:text-lg">
              A private, verified circle for adults in {BRAND.market} who would rather be introduced than browsed. Membership is by application, and every application is read by a person.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {signedIn ? (
                <Link to={home} className={buttonVariants({ size: 'lg' })}>
                  Open {BRAND.name}
                </Link>
              ) : (
                <>
                  <Link to="/apply" className={buttonVariants({ size: 'lg' })}>
                    Apply for membership
                  </Link>
                  <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
                    Sign in
                  </Link>
                </>
              )}
            </div>
            {/* Stacked on phones, one dotted line from sm up, so a separator never ends a line. */}
            <ul className="kicker mt-16 flex flex-col items-center gap-x-4 gap-y-2 text-muted-foreground sm:flex-row" aria-label="What membership means">
              <li>By application</li>
              <li aria-hidden="true" className="max-sm:hidden">
                &middot;
              </li>
              <li>Verified by hand</li>
              <li aria-hidden="true" className="max-sm:hidden">
                &middot;
              </li>
              <li>Private by default</li>
            </ul>
          </div>
        </section>

        <section className="border-t" aria-labelledby="membership">
          <div className="mx-auto grid max-w-[1120px] gap-12 px-4 py-24 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 md:px-8 md:py-32">
            <div>
              <p className="kicker text-muted-foreground">Membership</p>
              <h2 id="membership" className="mt-4 font-display text-5xl leading-[1.04] font-medium text-balance md:text-6xl">
                Introduced, <em>not</em> browsed.
              </h2>
              <p className="mt-6 max-w-[44ch] text-muted-foreground text-pretty">Three steps, each read by a person. Nobody can be seen until they are admitted.</p>
            </div>
            <ol className="divide-y border-y">
              {STEPS.map((s) => (
                <li key={s.numeral} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 py-8 sm:grid-cols-[4rem_minmax(0,1fr)]">
                  <span aria-hidden="true" className="font-display text-4xl leading-none font-medium text-muted-foreground italic">
                    {s.numeral}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium">{s.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground text-pretty">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t" aria-labelledby="verification">
          <div className="mx-auto max-w-[1120px] px-4 py-24 md:px-8 md:py-32">
            <div className="max-w-[680px]">
              <p className="kicker text-muted-foreground">Verification</p>
              <h2 id="verification" className="mt-4 font-display text-5xl leading-[1.04] font-medium text-balance md:text-6xl">
                Confirmed by people, <em>one detail at a time.</em>
              </h2>
              <p className="mt-6 max-w-[56ch] text-muted-foreground text-pretty">
                Verification is not a single checkmark. The committee reviews each of four details on its own, and a profile shows only what has been confirmed. We never collect government IDs or biometric data.
              </p>
            </div>
            <dl className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {VERIFICATION_DIMENSIONS.map((d) => {
                const Icon = VERIFICATION_COPY[d].icon;
                return (
                  <div key={d} className="border-t pt-6">
                    <Icon className="size-5 text-muted-foreground" />
                    <dt className="mt-5 font-display text-[1.875rem] leading-tight font-semibold">{VERIFICATION_LABEL[d]}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{VERIFICATION_COPY[d].body}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>

        <section className="border-t bg-muted/40" aria-labelledby="discreet">
          <div className="mx-auto grid max-w-[1120px] gap-12 px-4 py-24 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 md:px-8 md:py-32">
            <div>
              <p className="kicker text-muted-foreground">Privacy</p>
              <h2 id="discreet" className="mt-4 font-display text-5xl leading-[1.04] font-medium text-balance md:text-6xl">
                Discreet <em>by design.</em>
              </h2>
              <p className="mt-6 max-w-[44ch] text-muted-foreground text-pretty">
                At a glance, {BRAND.name} looks like a members&apos; app. In use, it is about meeting people well, and keeping what you share among members.
              </p>
            </div>
            <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {PRIVACY.map((p) => (
                <li key={p.title}>
                  <p.icon className="size-5 text-muted-foreground" />
                  <h3 className="mt-4 font-medium">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t" aria-labelledby="apply">
          <div className="mx-auto flex max-w-[760px] flex-col items-center px-4 py-24 text-center md:py-32">
            <RuledKicker>By application</RuledKicker>
            <h2 id="apply" className="mt-6 font-display text-5xl leading-[1.04] font-medium text-balance md:text-6xl">
              Ready to be <em>introduced?</em>
            </h2>
            <p className="mt-6 max-w-[46ch] text-muted-foreground text-pretty">The application takes a few minutes. A person reads every one, and the link we give you shows where yours stands.</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {signedIn ? (
                <Link to={home} className={buttonVariants({ size: 'lg' })}>
                  Open {BRAND.name}
                </Link>
              ) : (
                <>
                  <Link to="/apply" className={buttonVariants({ size: 'lg' })}>
                    Apply for membership
                  </Link>
                  <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
