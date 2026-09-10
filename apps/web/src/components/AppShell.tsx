import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Icon, type IconName } from './icons';
import { Avatar } from './MonogramPortrait';

const NAV: ReadonlyArray<{ to: string; label: string; icon: IconName }> = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/explore', label: 'Explore', icon: 'compass' },
  { to: '/feed', label: 'Feed', icon: 'feed' },
  { to: '/inbox', label: 'Inbox', icon: 'inbox' },
  { to: '/me', label: 'Me', icon: 'user' },
];

/** Member chrome: slim left rail on desktop, bottom bar on small screens. Settings is never in the nav. */
export function AppShell({ children, fullHeight = false }: { children: ReactNode; fullHeight?: boolean }) {
  const { profile } = useAuth();
  return (
    <div className="min-h-dvh md:pl-[76px] pb-16 md:pb-0">
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[76px] flex-col items-center border-r border-border bg-canvas py-4 z-30">
        <Link to="/home" aria-label="Peaches home" className="font-display text-ivory text-[22px] h-10 w-10 flex items-center justify-center rounded-md focus-ring">
          P
        </Link>
        <nav aria-label="Primary" className="mt-4 w-full px-2 flex flex-col gap-1.5">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className="group flex flex-col items-center gap-1 py-1 rounded-md focus-ring">
              {({ isActive }) => (
                <>
                  <span className={`w-10 h-10 rounded-md flex items-center justify-center motion ${isActive ? 'bg-surface-elevated text-ivory' : 'text-text-muted group-hover:bg-surface-hover group-hover:text-text-secondary'}`}>
                    <Icon name={item.icon} size={20} />
                  </span>
                  <span className={`text-micro ${isActive ? 'text-ivory' : 'text-text-muted'}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        {profile ? (
          <NavLink to="/me" aria-label="Your profile" className="mt-auto rounded-full focus-ring">
            <Avatar name={profile.firstName} src={profile.photos[0] ?? null} size={32} />
          </NavLink>
        ) : null}
      </aside>

      <main className={`mx-auto w-full max-w-[1120px] px-4 md:px-8 ${fullHeight ? 'h-[calc(100dvh-64px)] md:h-dvh py-0' : 'py-6 md:py-8'}`}>{children}</main>

      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 h-16 text-micro motion ${isActive ? 'text-ivory' : 'text-text-muted'}`
            }
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Page title in Georgia with an optional subtitle and right-side actions. */
export function PageHeader({ title, eyebrow, lede, actions, back }: { title: ReactNode; eyebrow?: ReactNode; lede?: ReactNode; actions?: ReactNode; back?: string }) {
  return (
    <header className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0 flex items-start gap-2">
        {back ? (
          <Link to={back} aria-label="Back" className="mt-1 -ml-2 w-10 h-10 inline-flex items-center justify-center rounded-md text-text-secondary motion hover:text-text hover:bg-surface-hover focus-ring">
            <Icon name="arrowLeft" />
          </Link>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <p className="text-micro uppercase tracking-[1.2px] text-text-muted mb-1.5">{eyebrow}</p> : null}
          <h1 className="font-display text-title leading-[34px] text-text truncate">{title}</h1>
          {lede ? <p className="mt-2 text-body text-text-secondary">{lede}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0 pt-0.5">{actions}</div> : null}
    </header>
  );
}
