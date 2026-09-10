import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './icons';

export function SettingsRow({ to, onClick, icon, label, description, danger = false, trailing }: { to?: string; onClick?: () => void; icon: IconName; label: string; description?: ReactNode; danger?: boolean; trailing?: ReactNode }) {
  const inner = (
    <>
      <Icon name={icon} size={20} className={danger ? 'text-danger' : 'text-text-muted'} />
      <span className="flex-1 min-w-0">
        <span className={`block text-body ${danger ? 'text-danger' : 'text-text'}`}>{label}</span>
        {description ? <span className="block text-caption text-text-muted truncate">{description}</span> : null}
      </span>
      {trailing ?? <Icon name="chevronRight" size={18} className="text-text-faint" />}
    </>
  );
  const cls = 'w-full flex items-center gap-3 min-h-[56px] px-1 text-left border-b border-border last:border-b-0 hover:bg-surface-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-border-strong';
  if (to) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
