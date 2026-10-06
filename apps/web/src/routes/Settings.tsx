import type { IconType } from 'react-icons';
import { LuBell, LuClipboardList, LuDatabase, LuEyeOff, LuLogOut, LuShield, LuShieldCheck, LuSlidersHorizontal, LuSunMoon, LuUser, LuUserX } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { BRAND } from '@peaches/core';
import { useAuth, useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { useConfirm } from '@/components/ConfirmProvider';
import { RowGroup, SettingsRow } from '@/components/SettingsRow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { THEME_PREFERENCES, useTheme } from '@/lib/theme';

export const SETTINGS_SECTIONS: ReadonlyArray<{ slug: string; label: string; icon: IconType }> = [
  { slug: 'account', label: 'Account', icon: LuUser },
  { slug: 'appearance', label: 'Appearance', icon: LuSunMoon },
  { slug: 'privacy', label: 'Privacy', icon: LuEyeOff },
  { slug: 'discovery-preferences', label: 'Discovery Preferences', icon: LuSlidersHorizontal },
  { slug: 'notifications', label: 'Notifications', icon: LuBell },
  { slug: 'verification', label: 'Verification', icon: LuShieldCheck },
  { slug: 'blocked-users', label: 'Blocked Users', icon: LuUserX },
  { slug: 'safety', label: 'Safety', icon: LuShield },
  { slug: 'data-account', label: 'Data & Account', icon: LuDatabase },
];

export function Settings() {
  usePageTitle('Settings');
  const { profile } = useMember();
  const { signOut, setAdminAsMember } = useAuth();
  const { preference } = useTheme();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const logout = async () => {
    if (await confirm({ title: 'Log out?', confirmLabel: 'Log out' })) void signOut().then(() => navigate('/', { replace: true }));
  };
  return (
    <div className="mx-auto max-w-[720px]" data-testid="settings">
      <PageHeader title="Settings" back="/me" />
      <RowGroup>
        {SETTINGS_SECTIONS.map((s) => (
          <SettingsRow
            key={s.slug}
            to={s.slug === 'discovery-preferences' ? '/me/preferences' : `/settings/${s.slug}`}
            icon={s.icon}
            label={s.label}
            description={s.slug === 'appearance' ? THEME_PREFERENCES.find((p) => p.value === preference)?.label : undefined}
          />
        ))}
      </RowGroup>
      <RowGroup className="mt-4">
        {profile.isAdmin ? (
          <SettingsRow
            icon={LuClipboardList}
            label="Committee panel"
            description="Applications, members, reports"
            onClick={() => {
              setAdminAsMember(false);
              navigate('/admin');
            }}
          />
        ) : null}
        <SettingsRow icon={LuLogOut} label="Log out" onClick={() => void logout()} trailing={<span />} destructive />
      </RowGroup>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        {BRAND.name} · {BRAND.market}
      </p>
    </div>
  );
}
