import { memo } from 'react';
import { Link } from 'react-router-dom';
import { nameAge, type PublicProfile } from '@peaches/core';
import { MonogramPortrait } from './MonogramPortrait';
import { VerificationBadge } from './VerificationBadge';

export function cardMetadata(profile: PublicProfile): string {
  const role = profile.occupation || profile.employmentDisplay || profile.educationDisplay || '';
  return [role, profile.displayArea].filter(Boolean).join(' · ');
}

/** 3:4 portrait, name + age in Georgia, a small verification indicator, one metadata line. Tap opens the profile. */
export const PersonCard = memo(function PersonCard({ profile }: { profile: PublicProfile }) {
  const photo = profile.photos[0];
  const verified = profile.publicVerificationBadges.length > 0;
  return (
    <Link
      to={`/profile/${profile.id}`}
      className="group block rounded-lg focus-ring"
      aria-label={`${nameAge(profile.firstName, profile.age)}${verified ? ', verified' : ''}. ${cardMetadata(profile)}`}
      data-testid="person-card"
    >
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface motion group-hover:brightness-105">
        {photo ? (
          <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <MonogramPortrait name={profile.firstName} className="h-full w-full" fontSize={48} />
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-image-ring" />
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 min-w-0">
        <span className="font-display text-name text-text truncate underline-offset-4 decoration-1 group-hover:underline">{nameAge(profile.firstName, profile.age)}</span>
        {verified ? <VerificationBadge /> : null}
      </div>
      <p className="mt-0.5 text-caption text-text-muted truncate">{cardMetadata(profile)}</p>
    </Link>
  );
});

export function PersonGrid({ profiles }: { profiles: ReadonlyArray<PublicProfile> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-x-4" data-testid="person-grid">
      {profiles.map((p) => (
        <PersonCard key={p.id} profile={p} />
      ))}
    </div>
  );
}
