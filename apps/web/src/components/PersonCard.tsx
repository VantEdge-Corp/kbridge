import { useState } from 'react';
import { Link } from 'react-router-dom';
import { nameAge, type PublicProfile } from '@peaches/core';
import { ActionContextMenu, MoreMenu, type MenuAction } from '@/components/ActionMenu';
import { Portrait } from '@/components/PersonAvatar';
import { VerificationBadge } from '@/components/VerificationBadge';
import { usePersonActions } from '@/hooks/usePersonActions';

export function cardMetadata(profile: PublicProfile): string {
  const role = profile.occupation || profile.employmentDisplay || profile.educationDisplay || '';
  return [role, profile.displayArea].filter(Boolean).join(' · ');
}

/**
 * 3:4 portrait, name and age, a verification seal, one metadata line. The
 * card opens the profile; its ⋯ button (and right-click or long-press) holds
 * the member actions. No like controls.
 */
export function PersonCard({ profile, actions }: { profile: PublicProfile; actions: MenuAction[] }) {
  const verified = profile.publicVerificationBadges.length > 0;
  const meta = cardMetadata(profile);
  const name = nameAge(profile.firstName, profile.age);
  return (
    <ActionContextMenu actions={actions} className="group/card relative">
      <Link
        to={`/profile/${profile.id}`}
        className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`${name}${verified ? ', verified' : ''}. ${meta}`}
        data-testid="person-card"
      >
        <Portrait
          name={profile.firstName}
          src={profile.photos[0] ?? null}
          loading="lazy"
          className="aspect-[3/4] rounded-xl [&_img]:transition-transform [&_img]:duration-300 group-hover/card:[&_img]:scale-[1.03]"
        />
        <div className="mt-3 flex min-w-0 items-center gap-1.5">
          <span className="truncate text-base font-medium underline-offset-4 group-hover/card:underline">{name}</span>
          {verified ? <VerificationBadge /> : null}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{meta}</p>
      </Link>
      <MoreMenu
        actions={actions}
        label={`More for ${profile.firstName}`}
        className="absolute top-2 right-2 size-8 rounded-full bg-background/80 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover/card:opacity-100 hover:bg-background focus-visible:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100"
      />
    </ActionContextMenu>
  );
}

/**
 * Two columns, three or four when its container is wide enough (next to the
 * Explore filters it stays at two or three). Blocking someone from a card
 * removes them at once.
 */
export function PersonGrid({ profiles }: { profiles: ReadonlyArray<PublicProfile> }) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const { actionsFor, dialogs } = usePersonActions({ onBlocked: (id) => setHidden((ids) => new Set(ids).add(id)) });
  return (
    <>
      <div className="@container" data-testid="person-grid">
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 @xl:grid-cols-3 @xl:gap-x-4 @4xl:grid-cols-4">
        {profiles
          .filter((p) => !hidden.has(p.id))
          .map((p) => (
            <PersonCard key={p.id} profile={p} actions={actionsFor(p)} />
          ))}
        </div>
      </div>
      {dialogs}
    </>
  );
}
