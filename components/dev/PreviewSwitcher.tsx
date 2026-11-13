import { Eye, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PREVIEW_ROLES } from '../../preview';
import { ROUTES, homeRouteForRole } from '../../routes/paths';
import { tokenStore } from '../../services/http';
import type { UserRole } from '../../types/user';
import { cx } from '../shared/utils/cx';

interface Target { label: string; to: string; /** Auth pages redirect signed-in users, so sign out first. */ signOut?: boolean }

const TARGETS: Record<UserRole, Target[]> = {
  platform_admin: [
    { label: 'System overview', to: '/platform' },
    { label: 'Requests inbox', to: '/platform/requests' },
    { label: 'Review organisation', to: '/platform/requests/req-52' },
    { label: 'Organisations', to: '/platform/organisations' },
    { label: 'Support tickets', to: '/platform/tickets?ticket=t-1042' },
    { label: 'Library system', to: '/platform/system' },
  ],
  organisation_admin: [
    { label: 'Overview', to: '/organisation' },
    { label: 'Upload materials', to: '/organisation/upload' },
    { label: 'Materials', to: '/organisation/materials' },
    { label: 'Members', to: '/organisation/members' },
  ],
  member: [{ label: 'Library (placeholder)', to: '/library' }],
};

const PUBLIC: Target[] = [
  { label: 'Login', to: ROUTES.login, signOut: true },
  { label: 'Register (invitation code)', to: `${ROUTES.register}?code=ATLA-2026`, signOut: true },
  { label: 'Enter organisation code', to: ROUTES.organisationCode },
  { label: 'Organisation registration', to: ROUTES.organisationRegistration },
  { label: 'Forgot password', to: ROUTES.forgotPassword },
  { label: 'Create password (reset link)', to: `${ROUTES.resetPassword}?token=demo` },
  { label: 'Verify email', to: ROUTES.verifyEmail },
  { label: 'Verify email (link clicked)', to: `${ROUTES.verifyEmail}?token=demo` },
];

/** Floating panel (preview mode only): switch role and jump to any screen. */
export function PreviewSwitcher() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = PREVIEW_ROLES.find((r) => r.role === user?.role);

  async function signInAs(role: UserRole, token: string) {
    setBusy(true);
    tokenStore.set(token);
    await refresh();
    setBusy(false);
    navigate(homeRouteForRole(role));
  }

  async function signOut() {
    tokenStore.clear();
    await refresh();
  }

  async function go(t: Target) {
    if (t.signOut && user) await signOut();
    navigate(t.to);
  }

  const btn = 'w-full rounded-md px-2.5 py-1.5 text-left text-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50';

  return (
    <div className="fixed bottom-4 right-4 z-[60] font-sans">
      {open ? (
        <div role="dialog" aria-label="Preview mode" className="w-72 rounded-xl border border-line bg-white p-3 shadow-[0_8px_30px_rgba(5,32,30,0.18)]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-deep">Preview mode</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close preview panel" className="grid size-7 place-items-center rounded text-muted hover:bg-mint"><X size={16} aria-hidden /></button>
          </div>

          <p className="px-1 text-[12px] font-semibold text-muted">Sign in as</p>
          <ul className="m-0 mb-2 list-none p-0">
            {PREVIEW_ROLES.map((r) => (
              <li key={r.role}>
                <button type="button" disabled={busy} onClick={() => signInAs(r.role, r.token)} aria-pressed={current?.role === r.role}
                  className={cx(btn, current?.role === r.role ? 'bg-mint font-semibold text-deep' : 'text-ink hover:bg-mint-soft')}>{r.label}</button>
              </li>
            ))}
            <li><button type="button" disabled={busy || !user} onClick={signOut} className={cx(btn, !user ? 'bg-mint font-semibold text-deep' : 'text-rose-text hover:bg-rose-bg')}>Signed out</button></li>
          </ul>

          {user && (
            <>
              <p className="border-t border-line px-1 pt-2 text-[12px] font-semibold text-muted">Jump to ({current?.label})</p>
              <ul className="m-0 mb-2 max-h-40 list-none overflow-y-auto p-0">
                {TARGETS[user.role].map((t) => <li key={t.to}><button type="button" onClick={() => go(t)} className={cx(btn, 'text-ink hover:bg-mint-soft')}>{t.label}</button></li>)}
              </ul>
            </>
          )}

          <p className="border-t border-line px-1 pt-2 text-[12px] font-semibold text-muted">Public screens</p>
          <ul className="m-0 max-h-44 list-none overflow-y-auto p-0">
            {PUBLIC.map((t) => <li key={t.to}><button type="button" onClick={() => go(t)} className={cx(btn, 'text-ink hover:bg-mint-soft')}>{t.label}</button></li>)}
          </ul>

          <p className="mt-2 border-t border-line px-1 pt-2 text-[11px] leading-4 text-muted">Mock data only; resets on reload. Turn off with VITE_PREVIEW_MODE=false.</p>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} aria-label="Open preview panel"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-deep px-4 text-[14px] font-semibold text-white shadow-lg hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <Eye size={16} aria-hidden />Preview · {current?.label ?? 'Signed out'}
        </button>
      )}
    </div>
  );
}
