import { Link } from 'react-router-dom';
import { INDUSTRY_OPTIONS, LIMITS, RELATIONSHIP_INTENT_OPTIONS, STUDENT_STATUS_OPTIONS, countryName, formatHeight, labelFor, nameAge, profileCompleteness } from '@peaches/core';
import { useAuth, useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { Group, GroupSection } from '../components/Group';
import { Icon } from '../components/icons';
import { MonogramPortrait } from '../components/MonogramPortrait';
import { ProfileMetadata } from '../components/ProfileMetadata';
import { SectionHeader } from '../components/SectionHeader';
import { SettingsRow } from '../components/SettingsRow';
import { VerificationStatusList } from '../components/VerificationStatusList';
import { usePageTitle } from '../hooks/usePageTitle';

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

  return (
    <div className="max-w-[720px]" data-testid="me">
      <PageHeader
        title={nameAge(profile.firstName, profile.age)}
        eyebrow={profile.displayArea}
        actions={
          <Link to="/settings" aria-label="Settings" className="w-11 h-11 inline-flex items-center justify-center rounded-md text-text-secondary motion hover:text-text hover:bg-surface-hover focus-ring" data-testid="settings-gear">
            <Icon name="settings" />
          </Link>
        }
      />

      <section className="mb-8">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {profile.photos.length === 0 ? (
            <MonogramPortrait name={profile.firstName} className="w-[96px] h-[128px] rounded-md shrink-0" fontSize={36} />
          ) : (
            profile.photos.map((p, i) => (
              <span key={p} className="relative w-[96px] h-[128px] rounded-md overflow-hidden shrink-0">
                <img src={p} alt={`Your photo ${i + 1}`} className="h-full w-full object-cover" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-image-ring" />
              </span>
            ))
          )}
          {profile.photos.length < LIMITS.photos ? (
            <Link to="/me/photos" className="w-[96px] h-[128px] rounded-md border border-dashed border-border-strong shrink-0 flex flex-col items-center justify-center gap-1 text-text-muted motion hover:text-text hover:border-ivory focus-ring">
              <Icon name="plus" size={18} />
              <span className="text-caption">Add photo</span>
            </Link>
          ) : null}
        </div>
      </section>

      <section className="mb-8" aria-label="Profile completeness">
        <Group>
          <GroupSection>
            <div className="flex items-baseline justify-between mb-2.5">
              <span className="text-body-sm text-text-secondary">Profile completeness</span>
              <span className="text-body-sm text-text" data-testid="completeness">
                {completeness}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-surface-elevated overflow-hidden">
              <div className="h-full bg-ivory rounded-full motion" style={{ width: `${completeness}%` }} />
            </div>
            {completeness < 100 ? (
              <p className="mt-2.5 text-body-sm text-text-muted">
                Complete profiles are shown more and read better.{' '}
                <Link to="/me/edit" className="text-text underline underline-offset-4 decoration-1">
                  Finish yours
                </Link>
              </p>
            ) : null}
          </GroupSection>
        </Group>
      </section>

      <section className="mb-8">
        <Group>
          <GroupSection
            eyebrow="Basics"
            action={
              <Link to="/me/edit" className="text-text-secondary hover:text-text motion">
                Edit
              </Link>
            }
          >
            <ProfileMetadata
              items={[
                { label: 'Work', value: profile.employmentDisplay },
                { label: 'Field', value: labelFor(INDUSTRY_OPTIONS, profile.industry) },
                { label: 'Education', value: profile.educationDisplay },
                { label: 'Standing', value: labelFor(STUDENT_STATUS_OPTIONS, profile.studentStatus) },
                { label: 'Height', value: profile.height ? formatHeight(profile.height) : '' },
                { label: 'Nationality', value: profile.nationalities.map(countryName).join(', ') },
                { label: 'Intent', value: labelFor(RELATIONSHIP_INTENT_OPTIONS, profile.relationshipIntent) },
              ]}
            />
            {profile.bio ? <p className="mt-4 text-body-sm text-text-secondary whitespace-pre-wrap">{profile.bio}</p> : <p className="mt-4 text-body-sm text-text-muted">No bio yet.</p>}
          </GroupSection>
        </Group>
      </section>

      <section className="mb-8">
        <SectionHeader title="Verification" />
        <VerificationStatusList verification={profile.verification} onChanged={() => void refreshProfile()} />
      </section>

      <section>
        <Group>
          <SettingsRow to="/me/edit" icon="pencil" label="Edit profile" description="Basics, background, intent, lifestyle, interests" />
          <SettingsRow to="/me/preferences" icon="sliders" label="Discovery preferences" description="Area, distance, and what matters to you" />
          <SettingsRow to="/me/photos" icon="camera" label="Photos" description={`${profile.photos.length} of ${LIMITS.photos}`} />
          <SettingsRow to={`/profile/${profile.id}`} icon="user" label="Preview your profile" description="How other members see you" />
        </Group>
      </section>
    </div>
  );
}
