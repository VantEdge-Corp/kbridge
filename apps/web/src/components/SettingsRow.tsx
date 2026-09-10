import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROW_HAIRLINE, rowInset } from './Group';
import { Icon, type IconName } from './icons';

/** A row inside a Group: icon, label, optional description, trailing chevron. Hairline inset under the text. */
export function SettingsRow({ to, onClick, icon, label, description, danger = false, trailing }: { to?: string; onClick?: () => void; icon: IconName; label: string; description?: ReactNode; danger?: boolean; trailing?: ReactNode }) {
  const inner = (
    <>
      <Icon name={icon} size={20} className={`shrink-0 ${danger ? 'text-danger' : 'text-text-muted'}`} />
      <span className="flex-1 min-w-0">
        <span className={`block text-body ${danger ? 'text-danger' : 'text-text'}`}>{label}</span>
        {description ? <span className="block text-body-sm text-text-muted truncate">{description}</span> : null}
      </span>
      {trailing ?? <Icon name="chevronRight" size={18} className="text-text-faint shrink-0" />}
    </>
  );
  const cls = 'w-full flex items-center gap-3 min-h-14 px-4 py-2 text-left motion hover:bg-surface-hover focus-ring';
  return (
    <div className={ROW_HAIRLINE} style={rowInset(48)}>
      {to ? (
        <Link to={to} className={cls}>
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={cls}>
          {inner}
        </button>
      )}
    </div>
  );
}
