import { LuBadgeCheck, LuBriefcase, LuGraduationCap, LuMapPin, LuShieldCheck, LuUserCheck } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { BRAND, VERIFICATION_DIMENSIONS, VERIFICATION_LABEL } from '@peaches/core';
import { useAuth } from '@/auth/AuthProvider';
import { homeFor } from '@/auth/guards';
import { PublicFooter, PublicHeader } from '@/components/PublicChrome';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePageTitle } from '@/hooks/usePageTitle';
import { cn } from '@/lib/utils';

const STEPS = [
  { n: '1', title: 'Apply', body: 'A short application: who you are, what you do, and why you want to meet people this way. No photos or documents are required to apply.' },
  { n: '2', title: 'Committee review', body: 'Every application is read by a person. Most decisions take a few days. You can check your status any time with the link we give you.' },
  { n: '3', title: 'Create your account', body: 'Once admitted, choose a password and complete your profile. From there you meet people through introductions, not browsing.' },
];

const VERIFICATION_COPY: Record<(typeof VERIFICATION_DIMENSIONS)[number], { body: string; icon: typeof LuBadgeCheck }> = {
  identity: { body: 'That you are who your profile says you are.', icon: LuUserCheck },
  education: { body: 'The school and degree you list.', icon: LuGraduationCap },
  student: { body: 'Current enrollment, for students.', icon: LuBadgeCheck },
  employment: { body: 'Your occupation and employer.', icon: LuBriefcase },
};

export function Landing() {
  usePageTitle();
  const { user, profile, adminAsMember } = useAuth();
  const signedIn = !!user && !!profile;
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader>
        {signedIn ? (
          <Link to={homeFor(profile, adminAsMember)} className={buttonVariants({ variant: 'ghost' })}>
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

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 md:px-8">
        <section className="py-20 md:py-32">
          <div className="max-w-[720px]">
            <Badge variant="outline" className="mb-6 h-6 gap-1.5 px-2.5 text-xs font-medium text-muted-foreground">
              <LuMapPin />
              {BRAND.market}
            </Badge>
            <h1 className="text-5xl font-semibold tracking-tight text-balance md:text-7xl">{BRAND.tagline}</h1>
            <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-muted-foreground text-pretty">
              {BRAND.name} is a verified, application-based way to meet people in {BRAND.market}. It is intentional, discreet, and for adults who would rather be introduced than browsed. Membership is by application, reviewed by a committee, and every profile can be verified one dimension at a time.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/apply" className={buttonVariants({ size: 'lg' })}>
                Apply
              </Link>
              {!signedIn ? (
                <Link to="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                  Sign in
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28" aria-labelledby="admission">
          <h2 id="admission" className="text-2xl font-semibold tracking-tight">
            How admission works
          </h2>
          <p className="mt-2 max-w-[60ch] text-muted-foreground">Three steps, each read by a person. Nobody is browsable until they are admitted.</p>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n}>
                <Card className="h-full">
                  <CardHeader>
                    <span className="mb-3 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular-nums">{s.n}</span>
                    <CardTitle className="text-lg">{s.title}</CardTitle>
                    <CardDescription className="leading-relaxed">{s.body}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className="pb-20 md:pb-28" aria-labelledby="verification">
          <h2 id="verification" className="text-2xl font-semibold tracking-tight">
            What verification means
          </h2>
          <p className="mt-2 max-w-[60ch] text-muted-foreground text-pretty">
            Verification is not a single checkmark. Each of four dimensions is reviewed on its own by the committee, and a profile shows only the ones that have been confirmed. We do not collect government IDs or biometric data.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {VERIFICATION_DIMENSIONS.map((d) => {
              const Icon = VERIFICATION_COPY[d].icon;
              return (
                <Card key={d} size="sm">
                  <CardContent className="flex flex-row items-start gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div className="grid gap-1">
                      <p className="font-medium">{VERIFICATION_LABEL[d]}</p>
                      <p className="text-sm text-muted-foreground">{VERIFICATION_COPY[d].body}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="pb-24 md:pb-32" aria-labelledby="discreet">
          <Card className="bg-muted/40 shadow-none">
            <CardContent className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div className="max-w-[60ch]">
                <span className="mb-4 flex size-9 items-center justify-center rounded-md bg-background text-foreground ring-1 ring-foreground/10">
                  <LuShieldCheck className="size-4" />
                </span>
                <h2 id="discreet" className="text-2xl font-semibold tracking-tight text-balance">
                  Discreet by design.
                </h2>
                <p className="mt-2 text-lg text-muted-foreground text-pretty">At a glance, {BRAND.name} looks like a members&apos; app. In use, it is about meeting people well.</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
                  Your exact location is never shown, only an area like &ldquo;Duluth area.&rdquo; Nationality, race or ethnicity, and lifestyle details are optional, and &ldquo;prefer not to say&rdquo; is always available. Nothing about you is ranked publicly.
                </p>
              </div>
              <Link to="/apply" className={cn(buttonVariants({ size: 'lg' }), 'justify-self-start')}>
                Apply for membership
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
