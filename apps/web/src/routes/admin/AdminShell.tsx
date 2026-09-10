import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../../components/Button';
import { Icon, type IconName } from '../../components/icons';
import { Wordmark } from '../../components/Wordmark';

const AREAS: ReadonlyArray<{ to: string; label: string; icon: IconName; end?: boolean }> = [
  { to: '/admin', label: 'Applications', icon: 'clipboard', end: true },
  { to: '/admin/members', label: 'Members', icon: 'users' },
  { to: '/admin/reports', label: 'Reports', icon: 'flag' },
];

/** Committee panel chrome: header with the member-view switch and a left sub-nav. */
export function AdminShell() {
  const { signOut, setAdminAsMember } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="h-16 px-4 md:px-6 flex items-center justify-between gap-3 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <Wordmark size={16} />
          <span className="hidden sm:inline text-micro uppercase tracking-[1.2px] text-text-muted">Committee</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setAdminAsMember(true);
              navigate('/home');
            }}
          >
            View as member
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void signOut().then(() => navigate('/', { replace: true }))}>
            Sign out
          </Button>
        </div>
      </header>
      <div className="flex-1 flex flex-col md:flex-row">
        <nav aria-label="Committee" className="md:w-56 md:border-r border-b md:border-b-0 border-border px-2 py-2 md:py-4 flex md:flex-col gap-1">
          {AREAS.map((a) => (
            <NavLink
              key={a.to}
              to={a.to}
              end={a.end}
              className={({ isActive }) => `flex items-center gap-3 h-11 px-3 rounded-md text-body-sm ${isActive ? 'bg-surface text-ivory' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <Icon name={a.icon} size={18} />
              {a.label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 min-w-0 px-4 md:px-6 py-5 max-w-[1080px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
