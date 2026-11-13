import { Check, Copy, Mail, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Alert, Button, SectionHeader } from '../shared';
import { Panel } from '../common/Panel';
import { sendInvitations } from '../../services/organisation.service';
import { getErrorMessage, isEmail } from '../../utils/validation';
import { cx } from '../shared/utils/cx';

/** "Knowledge is better shared": invite by email or share the invitation link. */
export function InvitePanel({ link, onSent }: { link: string; onSent?: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `https://${link}`;
  const message = `Join us on Loris Web Library: ${url}`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const emails = value.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
    if (emails.length === 0) return setError('Enter at least one email address.');
    const bad = emails.find((m) => !isEmail(m));
    if (bad) return setError(`"${bad}" doesn't look like an email address.`);
    setError(null); setBusy(true); setNotice(null);
    try {
      const { sent } = await sendInvitations(emails);
      setNotice({ kind: 'success', text: `${sent} ${sent === 1 ? 'invitation' : 'invitations'} sent.` });
      setValue('');
      onSent?.();
    } catch (err) { setNotice({ kind: 'error', text: getErrorMessage(err) }); } finally { setBusy(false); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setNotice({ kind: 'error', text: "Copying isn't available in this browser. Select the link and copy it manually." }); }
  }

  return (
    <Panel className="p-6">
      <SectionHeader title="Knowledge is better shared" description="Invite people to explore your organisation's library." />
      <form onSubmit={submit} noValidate className="mt-4">
        <label htmlFor="invite-emails" className="sr-only">Email addresses, separated by commas</label>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-0 flex-1">
            <Mail size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input id="invite-emails" value={value} onChange={(e) => { setValue(e.target.value); setError(null); }} disabled={busy} placeholder="Enter email addresses, separated by commas"
              aria-invalid={error ? true : undefined} aria-describedby={error ? 'invite-error' : undefined}
              className={cx('h-11 w-full rounded-lg border bg-white pl-9 pr-3 text-[16px] text-deep outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-brand/30', error ? 'border-rose-text' : 'border-line focus-visible:border-brand')} />
          </div>
          <Button type="submit" loading={busy} leftIcon={<Send size={14} aria-hidden />}>Send invitation</Button>
        </div>
        {error && <p id="invite-error" className="mt-1 text-[14px] text-rose-text">{error}</p>}
      </form>
      {notice && <Alert className="mt-3" severity={notice.kind} onDismiss={() => setNotice(null)}>{notice.text}</Alert>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-[14px] text-muted">Share via</span>
        <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener')}>WhatsApp</Button>
        <Button variant="outline" size="sm" onClick={() => { window.location.href = `sms:?&body=${encodeURIComponent(message)}`; }}>Messages</Button>
        <Button variant="outline" size="sm" onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent('Join us on Loris Web Library')}&body=${encodeURIComponent(message)}`; }}>Email</Button>
        <span className="text-[13px] text-muted sm:ml-auto">Anyone with the link can join</span>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-lg bg-mint-soft px-3 py-2">
        <p className="min-w-0 flex-1 truncate text-[15px] text-ink/80" aria-label="Invite link">{link}</p>
        <Button variant="outline" size="sm" onClick={copy} leftIcon={copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}>{copied ? 'Copied' : 'Copy link'}</Button>
      </div>
    </Panel>
  );
}
