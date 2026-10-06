import { LuCheck, LuLock, LuPencil, LuUserX } from 'react-icons/lu';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { VERIFICATION_LABEL, nameAge, profileDetails, profileMetaLine, profileVitals, timeAgo } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { MoreMenu } from '@/components/ActionMenu';
import { EmptyState } from '@/components/EmptyState';
import { LoadingBlock } from '@/components/Loading';
import { LoadError } from '@/components/Notice';
import { PhotoGallery } from '@/components/PhotoGallery';
import { DetailList, VitalBadges } from '@/components/ProfileFacts';
import { Section } from '@/components/Section';
import { RowGroup } from '@/components/SettingsRow';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePersonActions } from '@/hooks/usePersonActions';
import { api } from '@/lib/api';

export function Profile() {
  const { id = '' } = useParams();
  const { user } = useMember();
  const navigate = useNavigate();
  const own = id === user.id;
  const { data, loading, error, reload } = useAsync(async () => {
    const [profile, posts, active] = await Promise.all([
      api.profiles.get(id),
      api.posts.listByAuthor(id, user.id, 5),
      own ? Promise.resolve(new Set<string>()) : api.introductions.activeCounterpartIds(user.id),
    ]);
    return { profile, posts, requested: active.has(id) };
  }, [id, user.id]);
  const profile = data?.profile ?? null;
  usePageTitle(profile ? profile.firstName : 'Profile');
  const { actionsFor, dialogs, requested, requestIntroduction } = usePersonActions({ onBlocked: () => navigate('/home', { replace: true }) });

  if (loading) return <LoadingBlock />;
  if (error) return <LoadError message={error} onRetry={reload} />;
  if (!profile) {
    return (
      <div>
        <PageHeader title="Profile" back="/home" />
        <EmptyState icon={LuUserX} title="This member isn't available." body="They may have left, or their profile is no longer visible." />
      </div>
    );
  }

  const vitals = profileVitals(profile);
  const details = profileDetails(profile);
  const verified = profile.publicVerificationBadges.length > 0;

  return (
    <div data-testid="profile-view">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            {nameAge(profile.firstName, profile.age)}
            {verified ? <VerificationBadge className="[&>svg]:size-5 md:[&>svg]:size-6" /> : null}
          </span>
        }
        description={profileMetaLine(profile)}
        titleClassName="md:text-[3.25rem]"
        back={own ? '/me' : { history: '/home' }}
        actions={
          own ? (
            <Link to="/me/edit" className={buttonVariants({ variant: 'outline' })}>
              <LuPencil data-icon="inline-start" />
              Edit profile
            </Link>
          ) : (
            <MoreMenu actions={actionsFor(profile, { onProfile: true })} label={`More for ${profile.firstName}`} />
          )
        }
      />
      <div className="grid gap-8 md:grid-cols-[minmax(0,360px)_1fr] lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-12">
        <div className="grid content-start gap-4 md:sticky md:top-8 md:self-start">
          <PhotoGallery name={profile.firstName} photos={profile.photos} />
          {own ? (
            <p className="text-sm text-muted-foreground">This is you, as other members see you.</p>
          ) : data?.requested || requested.has(profile.id) ? (
            <Button size="lg" variant="outline" className="w-full" disabled>
              <LuCheck data-icon="inline-start" />
              Request sent
            </Button>
          ) : (
            <Button size="lg" className="w-full" onClick={() => requestIntroduction(profile)} data-testid="interested">
              Interested
            </Button>
          )}
          {!own ? (
            <p className="kicker flex items-center justify-center gap-1.5 text-muted-foreground">
              <LuLock className="size-3" />
              Seen only by members
            </p>
          ) : null}
        </div>

        <div className="grid content-start gap-8">
          {profile.bio ? (
            <Card>
              <CardContent className="gap-3">
                <p className="kicker text-muted-foreground">About {profile.firstName}</p>
                <p className="font-display text-[1.625rem] leading-snug whitespace-pre-wrap text-pretty">{profile.bio}</p>
              </CardContent>
            </Card>
          ) : null}

          {vitals.length > 0 ? (
            <Section title="At a glance">
              <VitalBadges facts={vitals} />
            </Section>
          ) : null}

          {details.length > 0 ? (
            <Section title="Details">
              <DetailList facts={details} />
            </Section>
          ) : null}

          {profile.interests.length > 0 ? (
            <Section title="Interests">
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((i) => (
                  <Badge key={i} variant="secondary" className="h-7 px-3 text-sm font-normal">
                    {i}
                  </Badge>
                ))}
              </div>
            </Section>
          ) : null}

          <Section title="Verification" description={verified ? 'Confirmed by the committee from the details this member provided.' : undefined}>
            {verified ? (
              <div className="flex flex-wrap gap-2">
                {profile.publicVerificationBadges.map((d) => (
                  <Badge key={d} variant="outline" className="h-8 gap-1.5 px-3 text-sm font-normal [&>span>svg]:size-4!">
                    <VerificationBadge dimension={d} />
                    {VERIFICATION_LABEL[d]}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No verified details yet.</p>
            )}
          </Section>

          <Section title="Posts">
            {data && data.posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing posted yet.</p>
            ) : (
              <RowGroup>
                {data?.posts.map((p) => (
                  <Item key={p.id} render={<Link to={`/post/${p.id}`} />} className="rounded-none px-4 py-3.5 hover:bg-muted">
                    <ItemContent>
                      <ItemTitle className="line-clamp-3 font-normal leading-relaxed">{p.body}</ItemTitle>
                      <ItemDescription className="text-xs">{timeAgo(p.createdAt)}</ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </RowGroup>
            )}
          </Section>
        </div>
      </div>
      {!own ? dialogs : null}
    </div>
  );
}
