import { useEffect } from 'react';

/**
 * Deterrents against copying, printing and saving library content.
 * IMPORTANT: browsers cannot prevent screenshots, screen recording, phone photos or
 * network-level downloads. This raises the effort required; it is not DRM.
 * Form fields stay fully usable (notes, search, support, login).
 */
const isEditable = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return Boolean(el?.closest?.('input, textarea, select, [contenteditable="true"]'));
};

export function ContentProtection() {
  useEffect(() => {
    const block = (e: Event) => { if (!isEditable(e.target)) e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (e.key === 'PrintScreen') {
        // Best effort only: overwrite the clipboard image where permitted.
        void navigator.clipboard?.writeText('Screen capture is disabled for LORIS content.').catch(() => undefined);
        return;
      }
      // Print, save, view-source, and copy/cut/select-all outside form fields.
      if (mod && ['p', 's', 'u'].includes(key)) { e.preventDefault(); return; }
      if (mod && ['c', 'x', 'a'].includes(key) && !isEditable(e.target)) e.preventDefault();
    };
    const events = ['copy', 'cut', 'contextmenu', 'dragstart'] as const;
    events.forEach((n) => document.addEventListener(n, block));
    const style = document.createElement('style');
    style.textContent = '@media print{body{display:none!important}} img,canvas,video,audio{-webkit-touch-callout:none;-webkit-user-drag:none}';
    document.head.appendChild(style);
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKey);
    return () => {
      events.forEach((n) => document.removeEventListener(n, block));
      style.remove();
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('keyup', onKey);
    };
  }, []);
  return null;
}
