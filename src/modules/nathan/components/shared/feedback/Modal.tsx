import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils/cx';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Footer actions, usually Buttons. */
  actions?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Use "alertdialog" for confirmations that need an explicit decision. */
  role?: 'dialog' | 'alertdialog';
  /** When false, backdrop click, Escape and the close button are disabled (e.g. while an action runs). */
  dismissible?: boolean;
}

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

export function Modal({ open, onClose, title, description, children, actions, size = 'md', role = 'dialog', dismissible = true }: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-deep/50 p-4" onMouseDown={() => dismissible && onClose()}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx('w-full bg-white p-7 shadow-[0_12px_40px_rgba(5,32,30,0.3)] outline-none', widths[size])}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-[26px] font-medium leading-tight text-deep">{title}</h2>
          {dismissible && <button onClick={onClose} aria-label="Close" className="-mr-1 rounded p-1 text-muted hover:text-deep"><X size={18} /></button>}
        </div>
        {description && <p id={descId} className="mt-2 text-[16px] leading-6 text-ink/75">{description}</p>}
        {children && <div className="mt-5">{children}</div>}
        {actions && <div className="mt-7 flex flex-wrap justify-end gap-2 border-t border-line pt-5">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}
