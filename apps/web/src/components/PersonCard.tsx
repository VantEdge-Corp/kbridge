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
      className="group block rounded-[12px] focus:outline-none focus-visible:ring-1 focus-visible:ring-border-strong"
      aria-label={`${nameAge(profile.firstName, profile.age)}${verified ? ', verified' : ''}. ${cardMetadata(profile)}`}
      data-testid="person-card"
    >
      <div className="aspect-[3/4] rounded-[12px] overflow-hidden bg-surface border border-border">
        {photo ? (
          <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          <MonogramPortrait name={profile.firstName} className="h-full w-full" fontSize={48} />
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5 min-w-0">
        <span className="font-display text-name text-text truncate">{nameAge(profile.firstName, profile.age)}</span>
        {verified ? <VerificationBadge /> : null}
      </div>
      <p className="text-caption text-text-muted truncate">{cardMetadata(profile)}</p>
    </Link>
  );
});

export function PersonGrid({ profiles }: { profiles: ReadonlyArray<PublicProfile> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-5" data-testid="person-grid">
      {profiles.map((p) => (
        <PersonCard key={p.id} profile={p} />
      ))}
    </div>
  );
}
