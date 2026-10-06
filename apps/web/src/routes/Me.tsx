import { LuCamera, LuEye, LuPencil, LuPlus, LuSettings, LuSlidersHorizontal } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { LIMITS, nameAge, profileCompleteness, profileMetaLine } from '@peaches/core';
import { useAuth, useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { PersonAvatar, Portrait } from '@/components/PersonAvatar';
import { Section } from '@/components/Section';
import { RowGroup, SettingsRow } from '@/components/SettingsRow';
import { VerificationBadge } from '@/components/VerificationBadge';
import { VerificationStatusList } from '@/components/VerificationStatusList';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePageTitle } from '@/hooks/usePageTitle';
import { cn } from '@/lib/utils';

export function Me() {
  usePageTitle('Me');
  const { profile } = useMember();
  const { refreshProfile } = useAuth();
  const completeness = profileCompleteness({
    photos: profile.photos.length,
    bio: profile.bio,
    occupation: profile.occupation,
    educationDisplay: profile.educationDisplay,
    height: profile.height,
    nationalities: profile.nationalities.length,
    languages: profile.languages.length,
    relationshipIntent: profile.relationshipIntent,
    interests: profile.interests.length,
    displayArea: profile.displayArea === 'Metro Atlanta' ? '' : profile.displayArea,
  });
  const meta = profileMetaLine(profile);

  return (
    <div className="mx-auto max-w-[720px]" data-testid="me">
      <PageHeader
        title="Me"
        actions={
          <Link to="/settings" aria-label="Settings" className={buttonVariants({ variant: 'ghost', size: 'icon' })} data-testid="settings-gear">
            <LuSettings />
          </Link>
        }
      />

      <div className="flex items-center gap-5">
        <Link to="/me/photos" aria-label={profile.photos.length > 0 ? 'Edit photos' : 'Add photos'} className="group/portrait relative shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <PersonAvatar name={profile.firstName} src={profile.photos[0] ?? null} className="size-20 sm:size-24" fallbackClassName="text-2xl" />
          <span className="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground transition-transform group-hover/portrait:scale-105">
            {profile.photos.length > 0 ? <LuPencil className="size-3.5" /> : <LuPlus className="size-3.5" />}
          </span>
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate py-0.5 font-display text-[2.25rem] leading-tight font-medium">{nameAge(profile.firstName, profile.age)}</h2>
            {profile.publicVerificationBadges.length > 0 ? <VerificationBadge className="[&>svg]:size-5" /> : null}
          </div>
          {meta ? <p className="mt-0.5 truncate text-sm text-muted-foreground">{meta}</p> : null}
          <Link to={`/profile/${profile.id}`} className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline">
            <LuEye className="size-4" />
            View as others see you
          </Link>
        </div>
      </div>

      <Card className="mt-8" aria-label="Profile completeness">
        <CardContent className="gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Profile completeness</span>
            <span className="text-sm text-muted-foreground tabular-nums" data-testid="completeness">
              {completeness}%
            </span>
          </div>
          <Progress value={completeness} aria-label="Profile completeness" />
          <p className="text-sm text-muted-foreground">
            {completeness < 100 ? (
              <>
                Complete profiles are shown more and read better.{' '}
                <Link to="/me/edit" className="font-medium text-foreground underline underline-offset-4">
                  Finish yours
                </Link>
              </>
            ) : (
              'Your profile is complete.'
            )}
          </p>
        </CardContent>
      </Card>

      <Section title="Photos" description={`${profile.photos.length} of ${LIMITS.photos}. The first is your portrait on cards.`} className="mt-10" action={
        <Link to="/me/photos" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Manage
        </Link>
      }>
        <div className="flex gap-3 overflow-x-auto p-0.5 pb-1">
          {profile.photos.length === 0 ? (
            <Portrait name={profile.firstName} className="aspect-[3/4] w-24 shrink-0 rounded-lg" initialClassName="text-4xl" />
          ) : (
            profile.photos.map((p, i) => <Portrait key={p} name={profile.firstName} src={p} alt={`Your photo ${i + 1}`} className="aspect-[3/4] w-24 shrink-0 rounded-lg" />)
          )}
          {profile.photos.length < LIMITS.photos ? (
            <Link
              to="/me/photos"
              className={cn(
                'flex aspect-[3/4] w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-sm text-muted-foreground outline-none transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
              )}
            >
              <LuPlus className="size-4" />
              Add photo
            </Link>
          ) : null}
        </div>
      </Section>

      <Section title="Profile" className="mt-10">
        <RowGroup>
          <SettingsRow to="/me/edit" icon={LuPencil} label="Edit profile" description="Basics, background, intent, lifestyle, interests" />
          <SettingsRow to="/me/preferences" icon={LuSlidersHorizontal} label="Discovery preferences" description="Area, distance, and what matters to you" />
          <SettingsRow to="/me/photos" icon={LuCamera} label="Photos" description={`${profile.photos.length} of ${LIMITS.photos}`} />
          <SettingsRow to={`/profile/${profile.id}`} icon={LuEye} label="Preview your profile" description="How other members see you" />
        </RowGroup>
      </Section>

      <Section title="Verification" description="Each detail is reviewed on its own by the committee. Only confirmed ones are shown to others." className="mt-10">
        <VerificationStatusList verification={profile.verification} onChanged={() => void refreshProfile()} />
      </Section>
    </div>
  );
}
