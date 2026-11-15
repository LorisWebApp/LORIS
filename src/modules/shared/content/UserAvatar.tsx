import { useState } from 'react';
import { cx } from '../utils/cx';

export interface UserAvatarProps {
  /** Used for the image alt text and to derive initials when none are given. */
  name?: string;
  initials?: string;
  imageUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tone?: 'dark' | 'light';
  className?: string;
}

const sizes = { xs: 'size-6 text-[11px]', sm: 'size-8 text-[13px]', md: 'size-10 text-[15px]', lg: 'size-14 text-[20px]' } as const;

export function deriveInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function UserAvatar({ name, initials, imageUrl, size = 'md', tone = 'dark', className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const text = initials ?? deriveInitials(name);
  return (
    <span className={cx('inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold leading-none', sizes[size], tone === 'dark' ? 'bg-deep text-white' : 'bg-mint text-deep', className)} {...(name ? { role: 'img', 'aria-label': name } : { 'aria-hidden': true })}>
      {imageUrl && !failed ? <img src={imageUrl} alt="" onError={() => setFailed(true)} className="size-full object-cover" /> : text || '?'}
    </span>
  );
}
