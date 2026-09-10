import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CHILDREN_OPTIONS,
  DRINKING_OPTIONS,
  EXERCISE_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  RACE_ETHNICITY_OPTIONS,
  RELATIONSHIP_INTENT_OPTIONS,
  SMOKING_OPTIONS,
  STUDENT_STATUS_OPTIONS,
  VERIFICATION_LABEL,
  countryName,
  formatHeight,
  labelFor,
  nameAge,
  timeAgo,
} from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { Button, IconButton, LinkButton } from '../components/Button';
import { Menu } from '../components/Dialog';
import { EmptyState } from '../components/EmptyState';
import { Group, GroupSection, ROW_HAIRLINE, rowInset } from '../components/Group';
import { Notice } from '../components/Field';
import { Icon } from '../components/icons';
import { IntroductionNoteDialog } from '../components/IntroductionNoteDialog';
import { LoadingBlock } from '../components/Loading';
import { ProfileMetadata } from '../components/ProfileMetadata';
import { ProfilePhotoGallery } from '../components/ProfilePhotoGallery';
import { ReportDialog } from '../components/ReportDialog';
import { SectionHeader } from '../components/SectionHeader';
import { TagChip } from '../components/TagChip';
import { VerificationBadge } from '../components/VerificationBadge';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';

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
  const [intro, setIntro] = useState(false);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const block = async () => {
    if (!profile || !window.confirm(`Block ${profile.firstName}? You won't see each other anymore.`)) return;
    try {
      await api.safety.block(user.id, profile.id);
      navigate('/home', { replace: true });
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };

  if (loading) return <LoadingBlock />;
  if (error) return <Notice tone="danger">{error}</Notice>;
  if (!profile) {
    return (
      <div>
        <PageHeader title="Profile" back="/home" />
        <EmptyState title="This member isn't available." body="They may have left, or their profile is no longer visible." />
      </div>
    );
  }

  const l = profile.lifestyle;
  const disclosedRace = profile.raceEthnicityDisclosure === 'disclosed' && profile.raceEthnicities.length > 0;

  return (
    <div data-testid="profile-view">
      <PageHeader
        title={nameAge(profile.firstName, profile.age)}
        eyebrow={profile.displayArea}
        back={own ? '/me' : undefined}
        actions={
          own ? (
            <LinkButton to="/me/edit" variant="secondary" size="sm">
              Edit
            </LinkButton>
          ) : (
            <div className="relative">
              <IconButton aria-label="More" onClick={() => setMenu((m) => !m)}>
                <Icon name="more" />
              </IconButton>
              <Menu open={menu} onClose={() => setMenu(false)} items={[{ label: 'Report', onClick: () => setReport(true) }, { label: 'Block', onClick: () => void block(), danger: true }]} />
            </div>
          )
        }
      />
      {actionError ? (
        <div className="mb-4">
          <Notice tone="danger">{actionError}</Notice>
        </div>
      ) : null}
      <div className="md:grid md:grid-cols-[360px_1fr] md:gap-10">
        <div className="max-w-[420px] md:max-w-none">
          <ProfilePhotoGallery name={profile.firstName} photos={profile.photos} />
          <div className="mt-5">
            {own ? (
              <p className="text-body-sm text-text-muted">This is you.</p>
            ) : data?.requested ? (
              <Button variant="secondary" className="w-full" disabled>
                Request sent
              </Button>
            ) : (
              <Button className="w-full" onClick={() => setIntro(true)} data-testid="interested">
                Interested
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 md:mt-0 space-y-8">
          <section>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-text-secondary">
              {profile.employmentDisplay ? <span>{profile.employmentDisplay}</span> : null}
              {profile.height ? <span>{formatHeight(profile.height)}</span> : null}
              {profile.publicVerificationBadges.map((d) => (
                <VerificationBadge key={d} dimension={d} label />
              ))}
            </div>
            {profile.bio ? <p className="mt-4 text-body text-text leading-relaxed whitespace-pre-wrap">{profile.bio}</p> : null}
          </section>

          <Group>
          <GroupSection eyebrow="Background">
            <ProfileMetadata
              items={[
                { label: 'Work', value: profile.employmentDisplay },
                { label: 'Field', value: labelFor(INDUSTRY_OPTIONS, profile.industry) },
                { label: 'Education', value: profile.educationDisplay },
                { label: 'Standing', value: labelFor(STUDENT_STATUS_OPTIONS, profile.studentStatus) },
                { label: 'Nationality', value: profile.nationalities.length ? profile.nationalities.map(countryName).join(', ') : '' },
                { label: 'Ethnicity', value: disclosedRace ? profile.raceEthnicities.map((r) => labelFor(RACE_ETHNICITY_OPTIONS, r)).join(', ') : '' },
                { label: 'Languages', value: profile.languages.length ? profile.languages.map((c) => labelFor(LANGUAGE_OPTIONS, c)).join(', ') : '' },
                { label: 'Area', value: profile.displayArea },
              ]}
            />
          </GroupSection>

          {profile.relationshipIntent ? (
            <GroupSection eyebrow="Intent">
              <p className="text-body-sm text-text">{labelFor(RELATIONSHIP_INTENT_OPTIONS, profile.relationshipIntent)}</p>
            </GroupSection>
          ) : null}

          {l.drinking || l.smoking || l.exercise || l.children ? (
            <GroupSection eyebrow="Lifestyle">
              <ProfileMetadata
                items={[
                  { label: 'Drinking', value: l.drinking && l.drinking !== 'prefer_not_to_say' ? labelFor(DRINKING_OPTIONS, l.drinking) : '' },
                  { label: 'Smoking', value: l.smoking && l.smoking !== 'prefer_not_to_say' ? labelFor(SMOKING_OPTIONS, l.smoking) : '' },
                  { label: 'Exercise', value: labelFor(EXERCISE_OPTIONS, l.exercise) },
                  { label: 'Children', value: l.children && l.children !== 'prefer_not_to_say' ? labelFor(CHILDREN_OPTIONS, l.children) : '' },
                ]}
              />
            </GroupSection>
          ) : null}
          </Group>

          {profile.interests.length > 0 ? (
            <section>
              <SectionHeader title="Interests" />
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((i) => (
                  <TagChip key={i}>{i}</TagChip>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <SectionHeader title="Verification" />
            {profile.publicVerificationBadges.length === 0 ? (
              <p className="text-body-sm text-text-muted">No verified details yet.</p>
            ) : (
              <Group>
                <ul>
                  {profile.publicVerificationBadges.map((d) => (
                    <li key={d} className={`${ROW_HAIRLINE} flex items-center gap-3 px-4 py-3 text-body-sm text-text`} style={rowInset(44)}>
                      <VerificationBadge dimension={d} size={18} />
                      {VERIFICATION_LABEL[d]} confirmed by the committee
                    </li>
                  ))}
                </ul>
              </Group>
            )}
          </section>

          <section>
            <SectionHeader title="Posts" />
            {data && data.posts.length === 0 ? (
              <p className="text-body-sm text-text-muted">Nothing posted yet.</p>
            ) : (
              <Group>
                <ul>
                  {data?.posts.map((p) => (
                    <li key={p.id} className={ROW_HAIRLINE} style={rowInset(16)}>
                      <Link to={`/post/${p.id}`} className="block px-4 py-3.5 motion hover:bg-surface-hover focus-ring">
                        <p className="text-body-sm text-text line-clamp-3">{p.body}</p>
                        <p className="mt-1 text-caption text-text-muted">{timeAgo(p.createdAt)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Group>
            )}
          </section>
        </div>
      </div>
      {!own ? <IntroductionNoteDialog open={intro} onClose={() => setIntro(false)} recipient={profile} onSent={reload} /> : null}
      {!own ? <ReportDialog open={report} onClose={() => setReport(false)} reportedId={profile.id} reportedName={profile.firstName} /> : null}
    </div>
  );
}
