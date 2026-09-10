import { useNavigate } from 'react-router-dom';
import { useAuth, useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { SettingsRow } from '../components/SettingsRow';
import { usePageTitle } from '../hooks/usePageTitle';

export const SETTINGS_SECTIONS = [
  { slug: 'account', label: 'Account', icon: 'user' },
  { slug: 'privacy', label: 'Privacy', icon: 'lock' },
  { slug: 'discovery-preferences', label: 'Discovery Preferences', icon: 'sliders' },
  { slug: 'notifications', label: 'Notifications', icon: 'bell' },
  { slug: 'verification', label: 'Verification', icon: 'shieldCheck' },
  { slug: 'blocked-users', label: 'Blocked Users', icon: 'userX' },
  { slug: 'safety', label: 'Safety', icon: 'shield' },
  { slug: 'data-account', label: 'Data & Account', icon: 'database' },
] as const;

export type SettingsSlug = (typeof SETTINGS_SECTIONS)[number]['slug'];

export function Settings() {
  usePageTitle('Settings');
  const { profile } = useMember();
  const { signOut, setAdminAsMember } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="max-w-[640px]" data-testid="settings">
      <PageHeader title="Settings" back="/me" />
      <section>
        {SETTINGS_SECTIONS.map((s) => (
          <SettingsRow key={s.slug} to={s.slug === 'discovery-preferences' ? '/me/preferences' : `/settings/${s.slug}`} icon={s.icon} label={s.label} />
        ))}
        {profile.isAdmin ? (
          <SettingsRow
            icon="clipboard"
            label="Committee panel"
            description="Applications, members, reports"
            onClick={() => {
              setAdminAsMember(false);
              navigate('/admin');
            }}
          />
        ) : null}
        <SettingsRow
          icon="logOut"
          label="Logout"
          onClick={() => {
            void signOut().then(() => navigate('/', { replace: true }));
          }}
          trailing={<span />}
        />
      </section>
    </div>
  );
}
