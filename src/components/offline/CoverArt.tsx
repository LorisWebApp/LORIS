import { Headphones, Play } from 'lucide-react';
import type { OfflineMaterialMetadata } from '../../group-d/types/models';
import { getMaterialKind } from '../../types/offline';

const palettes = [
  ['#3b5d56', '#a9c4bb'], ['#0e3a57', '#38a3b8'], ['#4d6b45', '#c9d9a8'],
  ['#6b5a3e', '#e3d3b0'], ['#44302b', '#c79a7c'], ['#2c3e5f', '#9db4d6'],
];

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Cover image if the material has one; otherwise a generated cover (no artwork is invented). */
export function CoverArt({ m, className = '' }: { m: OfflineMaterialMetadata; className?: string }) {
  if (m.coverUrl) {
    return <img src={m.coverUrl} alt="" className={`size-full object-cover ${className}`} loading="lazy" />;
  }
  const [a, b] = palettes[hash(m.title) % palettes.length];
  return (
    <div
      className={`flex size-full items-center justify-center p-3 text-center ${className}`}
      style={{ background: `linear-gradient(160deg, ${a}, ${b})` }}
      aria-hidden
    >
      <span className="line-clamp-4 font-serif text-lg leading-tight text-white/90">{m.title}</span>
    </div>
  );
}

export function CoverOverlayIcon({ m }: { m: OfflineMaterialMetadata }) {
  const kind = getMaterialKind(m);
  if (kind === 'video')
    return (
      <span className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink">
        <Play size={16} fill="currentColor" />
      </span>
    );
  if (kind === 'audio')
    return (
      <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-white/85 text-ink">
        <Headphones size={16} />
      </span>
    );
  return null;
}
