import { ArrowRight, Info, Mail, Clock, MapPin, HardDrive } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOfflineStorageUsage } from '../../group-d/offline/offlineMaterials';
import { INSTITUTION, ROUTES } from '../../integration/loris';
import { formatBytes } from '../../lib/format';
import type { ChatMessage } from '../../types/chat';

/** Free device storage from the browser's storage estimate (hidden when unsupported). */
function useFreeStorage() {
  const [free, setFree] = useState<{ freeBytes: number; usedPct: number } | null>(null);
  useEffect(() => {
    let alive = true;
    getOfflineStorageUsage()
      .then((u) => {
        if (alive && u.quotaBytes && u.usageBytes !== undefined)
          setFree({ freeBytes: u.quotaBytes - u.usageBytes, usedPct: (u.usageBytes / u.quotaBytes) * 100 });
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);
  return free;
}

export function OfflineExtras({ mobile }: { mobile: boolean }) {
  const free = useFreeStorage();
  return (
    <div className="mt-3 space-y-3">
      {free &&
        (mobile ? (
          <div className="rounded-lg bg-mint px-3 py-2.5">
            <p className="flex items-center justify-between text-[11px] font-semibold text-ink">
              <span className="flex items-center gap-1.5"><HardDrive size={12} />Local Storage</span>
              <span className="text-brand">{formatBytes(free.freeBytes)} available</span>
            </p>
            <div className="mt-2 h-1 rounded-full bg-white"><div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(free.usedPct, 2)}%` }} /></div>
          </div>
        ) : (
          <p className="flex items-center justify-between rounded-md bg-white/60 px-3 py-2 text-[11px] text-ink/70">
            <span className="flex items-center gap-1.5"><HardDrive size={12} />Local Storage Status:</span>
            <span className="font-semibold text-ink">{formatBytes(free.freeBytes)} free</span>
          </p>
        ))}
      <Link
        to={ROUTES.offlineLibrary}
        className={
          mobile
            ? 'flex h-10 items-center justify-center gap-2 rounded-full bg-ink text-xs font-semibold text-white'
            : 'inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[11px] font-semibold text-white'
        }
      >
        {mobile ? 'Open Offline Library' : <>Go to Offline Library <ArrowRight size={11} /></>}
      </Link>
    </div>
  );
}

export function SupportExtras({ mobile }: { mobile: boolean }) {
  return (
    <Link
      to={ROUTES.support}
      className={
        mobile
          ? 'mt-3 flex h-10 items-center justify-center rounded-full bg-mint text-xs font-semibold text-ink'
          : 'mt-3 inline-flex rounded-full bg-ink px-4 py-2 text-[11px] font-semibold text-white'
      }
    >
      {mobile ? 'Contact Support' : 'Submit Support Ticket'}
    </Link>
  );
}

/** Shown when the rule-based engine has no answer: route to human support. */
export function HandoffExtras({ mobile, onBackToFaq }: { mobile: boolean; onBackToFaq: () => void }) {
  const navigate = useNavigate();
  if (mobile) {
    return (
      <div className="mt-3 border-t border-line pt-3">
        <p className="text-[13px] text-deep">Need help from our team? Tap below to submit a support ticket directly to our university archival staff.</p>
        <button onClick={() => navigate(ROUTES.support)} className="mt-3 flex h-10 w-full items-center justify-center rounded-full bg-mint text-xs font-semibold text-ink">Contact Support</button>
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-3">
      <ul className="space-y-2 rounded-lg bg-white px-4 py-3 text-[12px] text-deep">
        <li className="flex items-center gap-2"><Mail size={12} className="text-muted" /><b>Email:</b> {INSTITUTION.supportEmail}</li>
        <li className="flex items-center gap-2"><Clock size={12} className="text-muted" /><b>Support Desk:</b> {INSTITUTION.supportDesk}</li>
        <li className="flex items-center gap-2"><MapPin size={12} className="text-muted" /><b>Physical Reading Room:</b> {INSTITUTION.readingRoom}</li>
      </ul>
      <p className="text-[11px] text-muted">Would you like to open a formal Support Ticket for the curatorial desk?</p>
      <div className="flex gap-2">
        <button onClick={() => navigate(ROUTES.support)} className="rounded-md bg-ink px-4 py-2 text-[11px] font-semibold text-white">Submit Support Ticket</button>
        <button onClick={onBackToFaq} className="rounded-md bg-white px-4 py-2 text-[11px] font-semibold text-ink">Back to FAQ</button>
      </div>
    </div>
  );
}

export function HandoffTitle() {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-ink/70">
      <Info size={12} /> Archival Desk Escalation Protocol
    </p>
  );
}

export function metaLabel(m: ChatMessage): string {
  if (m.role === 'user') return 'Delivered';
  if (m.botKind === 'welcome') return 'Automated Welcome';
  if (m.botKind === 'handoff') return 'Manual Routing Hand-off';
  return 'Rule-matched Response';
}
