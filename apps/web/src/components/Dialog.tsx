import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './Button';
import { Icon } from './icons';

/** Open dialogs, innermost last, so Escape only closes the topmost one. */
const openStack: symbol[] = [];

/** Accessible modal: Escape closes, focus moves inside, backdrop click closes. Renders as a sheet on small screens. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = Symbol('dialog');
    openStack.push(id);
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openStack[openStack.length - 1] === id) onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>('input, textarea, select, button');
      target?.focus();
    }, 0);
    return () => {
      const at = openStack.indexOf(id);
      if (at >= 0) openStack.splice(at, 1);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = openStack.length > 0 ? 'hidden' : previousOverflow;
      window.clearTimeout(t);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="presentation">
      <div className="absolute inset-0 bg-[rgba(11,11,12,0.72)]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[92dvh] flex flex-col bg-surface-elevated border border-border rounded-t-xl sm:rounded-xl shadow-2xl`}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-border">
          <h2 className="font-display text-subheading text-text">{title}</h2>
          <IconButton aria-label="Close" onClick={onClose} className="-mr-2">
            <Icon name="x" />
          </IconButton>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer ? <div className="px-5 py-3 border-t border-border flex justify-end gap-3">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

/** Simple anchored menu for overflow actions. */
export function Menu({ open, onClose, items }: { open: boolean; onClose: () => void; items: Array<{ label: string; onClick: () => void; danger?: boolean }> }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div role="menu" className="absolute right-0 top-full mt-1 z-50 min-w-44 bg-surface-elevated border border-border rounded-md py-1 shadow-xl">
        {items.map((item) => (
          <button
            key={item.label}
            role="menuitem"
            type="button"
            onClick={() => {
              onClose();
              item.onClick();
            }}
            className={`w-full text-left px-4 h-11 text-body-sm hover:bg-surface-hover ${item.danger ? 'text-danger' : 'text-text'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
