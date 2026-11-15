import { WifiOff } from 'lucide-react';
import { cx } from '../utils/cx';

export interface OfflineIndicatorProps {
  /** Connectivity is supplied by the caller (e.g. a network hook) so this stays presentational. */
  isOnline: boolean;
  /** `dot` = coloured dot + label; `badge` = label, with an icon while offline; `banner` = full-width notice, rendered only while offline. */
  variant?: 'dot' | 'badge' | 'banner';
  onlineLabel?: string;
  offlineLabel?: string;
  /** Supporting text for the banner. */
  description?: string;
  /** Use on dark surfaces. */
  tone?: 'default' | 'inverse';
  className?: string;
}

export function OfflineIndicator({ isOnline, variant = 'dot', onlineLabel = 'Online', offlineLabel = 'Offline', description, tone = 'default', className }: OfflineIndicatorProps) {
  const label = isOnline ? onlineLabel : offlineLabel;
  if (variant === 'banner') {
    if (isOnline) return null;
    return (
      <div role="status" className={cx('flex items-center gap-3 border-b border-amber-600/40 bg-amber-50 px-5 py-2.5 text-[16px] text-amber-900', className)}>
        <WifiOff size={16} aria-hidden />
        <span className="font-semibold">{offlineLabel}</span>
        {description && <span className="text-amber-900/80">{description}</span>}
      </div>
    );
  }
  return (
    <span role="status" className={cx('inline-flex items-center gap-1.5 text-[15px]', tone === 'inverse' ? 'text-white/80' : 'text-ink', className)}>
      {variant === 'badge' && !isOnline
        ? <WifiOff size={13} aria-hidden />
        : <span className={cx('size-1.5 rounded-full', isOnline ? (tone === 'inverse' ? 'bg-badge' : 'bg-brand') : 'bg-amber-500')} aria-hidden />}
      {label}
    </span>
  );
}
