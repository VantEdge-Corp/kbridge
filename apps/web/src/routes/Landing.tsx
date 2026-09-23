import { Link } from 'react-router-dom';
import { BRAND, VERIFICATION_DIMENSIONS, VERIFICATION_LABEL } from '@peaches/core';
import { LegalLinks } from '../components/LegalLinks';
import { useAuth } from '../auth/AuthProvider';
import { homeFor } from '../auth/guards';
import { LinkButton } from '../components/Button';
import { Eyebrow } from '../components/Field';
import { Group } from '../components/Group';
import { Wordmark } from '../components/Wordmark';
import { usePageTitle } from '../hooks/usePageTitle';

const STEPS = [
  { n: 'I', title: 'Apply', body: 'A short application: who you are, what you do, and why you want to meet people this way. No photos or documents are required to apply.' },
  { n: 'II', title: 'Committee review', body: 'Every application is read by a person. Most decisions take a few days. You can check your status any time with the link we give you.' },
  { n: 'III', title: 'Create your account', body: 'Once admitted, choose a password and complete your profile. From there you meet people through introductions, not browsing.' },
];

const VERIFICATION_COPY: Record<(typeof VERIFICATION_DIMENSIONS)[number], string> = {
  identity: 'That you are who your profile says you are.',
  education: 'The school and degree you list.',
  student: 'Current enrollment, for students.',
  employment: 'Your occupation and employer.',
};

export function Landing() {
  usePageTitle();
  const { user, profile, adminAsMember } = useAuth();
  const signedIn = !!user && !!profile;
  return (
    <div className="relative min-h-dvh flex flex-col">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[720px] hero-glow" />
      <header className="sticky top-0 z-30 h-16 px-5 md:px-10 flex items-center justify-between bg-canvas/80 backdrop-blur-md border-b border-border/60">
        <Wordmark />
        <nav className="flex items-center gap-5 text-body-sm">
          {signedIn ? (
            <Link to={homeFor(profile, adminAsMember)} className="text-text-secondary hover:text-text motion">
              Open {BRAND.name}
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-text-secondary hover:text-text motion">
                Sign in
              </Link>
              <LinkButton to="/apply" size="sm">
                Apply
              </LinkButton>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-5 md:px-8">
        <section className="relative pt-20 md:pt-32 pb-16 md:pb-24">
          <div className="max-w-[720px]">
            <Eyebrow className="mb-5">{BRAND.market}</Eyebrow>
            <h1 className="font-display text-[44px] md:text-[64px] leading-[1.02] tracking-[-0.01em] text-text">{BRAND.tagline}</h1>
            <p className="mt-6 text-body md:text-subheading text-text-secondary max-w-[54ch] leading-relaxed">
              {BRAND.name} is a verified, application-based way to meet people in {BRAND.market}. It is intentional, discreet, and for
              adults who would rather be introduced than browsed. Membership is by application, reviewed by a committee, and
              every profile can be verified one dimension at a time.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <LinkButton to="/apply">Apply</LinkButton>
              {!signedIn ? (
                <LinkButton to="/login" variant="secondary">
                  Sign in
                </LinkButton>
              ) : null}
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-24">
          <Eyebrow className="mb-4">How admission works</Eyebrow>
          <Group>
            <ol className="grid md:grid-cols-3 gap-px bg-border">
              {STEPS.map((s) => (
                <li key={s.n} className="bg-surface p-6">
                  <p className="font-display text-heading text-text-muted">{s.n}</p>
                  <p className="mt-3 font-display text-subheading text-text">{s.title}</p>
                  <p className="mt-2 text-body-sm text-text-secondary leading-relaxed">{s.body}</p>
                </li>
              ))}
            </ol>
          </Group>
        </section>

        <section className="pb-16 md:pb-24">
          <Eyebrow className="mb-4">What verification means</Eyebrow>
          <p className="text-body text-text-secondary max-w-[60ch] leading-relaxed">
            Verification is not a single checkmark. Each of four dimensions is reviewed on its own by the committee, and a
            profile shows only the ones that have been confirmed. We do not collect government IDs or biometric data.
          </p>
          <Group className="mt-6">
            <dl className="grid sm:grid-cols-2 gap-px bg-border">
              {VERIFICATION_DIMENSIONS.map((d) => (
                <div key={d} className="bg-surface p-5">
                  <dt className="text-body text-text">{VERIFICATION_LABEL[d]}</dt>
                  <dd className="mt-1 text-body-sm text-text-muted">{VERIFICATION_COPY[d]}</dd>
                </div>
              ))}
            </dl>
          </Group>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="max-w-[60ch]">
            <p className="font-display text-heading text-text leading-snug">
              Discreet by design. At a glance, {BRAND.name} looks like a members&apos; app. In use, it is about meeting people well.
            </p>
            <p className="mt-4 text-body-sm text-text-secondary leading-relaxed">
              Your exact location is never shown, only an area like &ldquo;Duluth area.&rdquo; Nationality, race or ethnicity, and
              lifestyle details are optional, and &ldquo;prefer not to say&rdquo; is always available. Nothing about you is ranked publicly.
            </p>
            <div className="mt-8">
              <LinkButton to="/apply">Apply for membership</LinkButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-5 md:px-10 flex flex-wrap items-center justify-between gap-4 border-t border-border text-caption text-text-muted">
        <span>
          &copy; {new Date().getFullYear()} {BRAND.company} · {BRAND.name}, {BRAND.market}
        </span>
        <LegalLinks />
      </footer>
    </div>
  );
}
